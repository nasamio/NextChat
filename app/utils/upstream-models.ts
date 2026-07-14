import { ServiceProvider } from "../constant";
import { useAppConfig } from "../store";
import { SITE_CONFIG } from "../config/site";

/** 从服务端 /api/upstream-models 拉 CPA 真实模型，并写入 store */
export async function fetchAndApplyUpstreamModels(): Promise<{
  ids: string[];
  error?: string;
}> {
  const config = useAppConfig.getState();
  try {
    // 直接请求专用接口，避免 getHeaders 混入本地 API Key
    const { useAccessStore } = await import("../store");
    const accessCode = useAccessStore.getState().accessCode?.trim() || "";
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessCode) {
      headers.Authorization = `Bearer nk-${accessCode}`;
    }

    const res = await fetch("/api/upstream-models", {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const body = await res.json();
    if (!res.ok || body?.error) {
      const msg =
        body?.message ||
        body?.msg ||
        `拉取失败 HTTP ${res.status}`;
      config.setUpstreamModelsError(msg);
      config.replaceWithUpstreamModels([]);
      return { ids: [], error: msg };
    }

    const data = Array.isArray(body?.data) ? body.data : [];
    const ids = data.map((m: any) => m.id || m.name).filter(Boolean);
    if (!ids.length) {
      const msg = "上游返回空列表";
      config.setUpstreamModelsError(msg);
      config.replaceWithUpstreamModels([]);
      return { ids: [], error: msg };
    }

    const models = ids.map((id: string, i: number) => ({
      name: id,
      displayName: id,
      available: true,
      sorted: 1000 + i,
      provider: {
        id: "openai",
        providerName: "OpenAI",
        providerType: "openai",
        sorted: 1,
      },
    }));
    config.replaceWithUpstreamModels(models);

    const preferred = SITE_CONFIG.preferredDefaultModel;
    const current = config.modelConfig.model;
    if (!ids.includes(current)) {
      config.update((c) => {
        c.modelConfig.model = (
          ids.includes(preferred) ? preferred : ids[0]
        ) as any;
        c.modelConfig.providerName = ServiceProvider.OpenAI;
      });
    }
    console.log("[Models] applied", ids.length, ids);
    return { ids };
  } catch (e: any) {
    const msg = e?.message || String(e);
    config.setUpstreamModelsError(msg);
    return { ids: [], error: msg };
  }
}
