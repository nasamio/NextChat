import { useMemo } from "react";
import { useAccessStore, useAppConfig } from "../store";
import { collectModelsWithDefaultModel } from "./model";
import { SITE_CONFIG } from "../config/site";
import { LLMModel } from "../client/api";

export function useAllModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();
  const models = useMemo(() => {
    // 自用：直接用上游 ID 列表，绕过 customModels / 内置 DEFAULT 过滤
    if (SITE_CONFIG.forceServerProxy) {
      const ids = configStore.upstreamModelIds || [];
      if (ids.length > 0) {
        return ids.map((id, i) => ({
          name: id,
          displayName: id,
          available: true,
          sorted: 1000 + i,
          isDefault: false,
          provider: {
            id: "openai",
            providerName: "OpenAI",
            providerType: "openai",
            sorted: 1,
          },
        }));
      }
      // 尚未拉到上游时，只展示 available 的（通常为空）
      return (configStore.models || []).filter((m) => m.available);
    }

    return collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );
  }, [
    accessStore.customModels,
    accessStore.defaultModel,
    configStore.customModels,
    configStore.models,
    configStore.upstreamModelIds,
  ]);

  return models;
}
