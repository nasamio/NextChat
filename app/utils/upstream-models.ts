import { getClientApi } from "../client/api";
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
    const api = getClientApi(ServiceProvider.OpenAI);
    const models = await api.llm.models();
    if (!models.length) {
      const msg = "上游未返回模型（检查访问密码 / CPA）";
      config.setUpstreamModelsError(msg);
      config.replaceWithUpstreamModels([]);
      return { ids: [], error: msg };
    }
    config.replaceWithUpstreamModels(models);
    const ids = models.map((m) => m.name);
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
