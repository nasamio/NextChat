import { NextRequest, NextResponse } from "next/server";
import { auth } from "../auth";
import { getServerSideConfig } from "@/app/config/server";
import { SITE_CONFIG } from "@/app/config/site";
import { ModelProvider } from "@/app/constant";

/**
 * 服务端代拉上游 OpenAI 兼容 /v1/models（写死 BASE_URL + 服务端 Key）
 * 浏览器只打本接口，不直连 CPA。
 */
export async function GET(req: NextRequest) {
  const serverConfig = getServerSideConfig();
  // 自用部署：拉模型列表只用服务端 Key，不依赖浏览器里的 API Key
  // 客户端若误传 sk-/自定义 Key（本地缓存），忽略即可，避免 HIDE_USER_API_KEY 直接 401
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token.startsWith("nk-")) {
    const authResult = auth(req, ModelProvider.GPT);
    if (authResult.error) {
      return NextResponse.json(authResult, { status: 401 });
    }
  }
  // 无 nk- 访问码时：只要服务端配置了 OPENAI_API_KEY 就允许列模型（单机自用）
  if (!serverConfig.apiKey) {
    return NextResponse.json(
      { error: true, message: "server OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }
  let baseUrl = (serverConfig.baseUrl || SITE_CONFIG.serverBaseUrl).trim();
  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  // 兼容误配成 .../v1
  if (baseUrl.endsWith("/v1")) {
    baseUrl = baseUrl.slice(0, -3);
  }

  const modelsUrl = `${baseUrl}/v1/models`;
  const apiKey = serverConfig.apiKey;

  if (!apiKey) {
    return NextResponse.json(
      { error: true, message: "server OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    console.log("[upstream-models] GET", modelsUrl);
    const res = await fetch(modelsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();
    let body: any;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error: true,
          message: "upstream returned non-json",
          status: res.status,
          raw: text.slice(0, 500),
        },
        { status: 502 },
      );
    }

    if (!res.ok) {
      console.error("[upstream-models] upstream error", res.status, text.slice(0, 300));
      return NextResponse.json(
        {
          error: true,
          message: body?.error?.message || body?.message || "upstream models failed",
          status: res.status,
          body,
        },
        { status: res.status },
      );
    }

    const data = Array.isArray(body?.data) ? body.data : [];
    console.log("[upstream-models] count=", data.length);

    return NextResponse.json(
      {
        object: "list",
        data,
        source: "upstream",
        baseUrl,
        count: data.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e: any) {
    console.error("[upstream-models] fetch error", e);
    return NextResponse.json(
      {
        error: true,
        message: e?.message || String(e),
      },
      { status: 502 },
    );
  }
}
