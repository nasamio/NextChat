/**
 * 炎火云 / 自用部署写死配置
 * - 上游在服务端 env：BASE_URL + OPENAI_API_KEY（容器内连 CPA）
 * - 浏览器只访问本站 /api/openai，禁止自定义接口直连 host.docker.internal
 */
export const SITE_CONFIG = {
  /** 强制走 NextChat 服务端代理，忽略页面「自定义接口」 */
  forceServerProxy: true,

  /**
   * 服务端默认上游（仅作文档/兜底；docker 环境变量 BASE_URL 优先）
   * 容器内访问本机 CPA 网关，不要带 /v1
   */
  serverBaseUrl: "http://host.docker.internal:8317",

  /** 打开页面拉 /v1/models 后，优先默认选中的模型 */
  preferredDefaultModel: "gpt-5.5",

  /** 模型列表刷新间隔（毫秒），0 表示仅启动时拉一次 */
  modelsRefreshMs: 5 * 60 * 1000,

  /** 顶栏展示的上游说明 */
  upstreamLabel: "CPA",
} as const;
