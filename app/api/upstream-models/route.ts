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
  // 有服务端 Key 时：允许仅用访问码；访问码错误才 401
  // 若请求带 nk- 访问码则校验；未带码但已配置 CODE 时也允许（单机自用，避免前端码不同步导致空列表）
  const authHeader = req.headers.get("Authorization") ?? "";
  const hasClientAuth = authHeader.trim().length > 0;
  if (hasClientAuth) {
    const authResult = auth(req, ModelProvider.GPT);
    if (authResult.error) {
      return NextResponse.json(authResult, { status: 401 });
    }
  } else if (serverConfig.needCode && !serverConfig.apiKey) {
    return NextResponse.json(
      { error: true, msg: "empty access code" },
      { status: 401 },
    );
  }
  // 自用：无客户端 Authorization 时，只要服务端配了 OPENAI_API_KEY 就放行拉模型
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
