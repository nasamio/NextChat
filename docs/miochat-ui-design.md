# MioChat UI 美化与品牌重命名 — 设计文档

| 字段 | 内容 |
|------|------|
| 状态 | **Ready for implementation** |
| 仓库 | `C:\Users\mio\study\NextChat`（GitHub: `nasamio/NextChat`） |
| 部署 | Docker 镜像 `nextchat-yanhua:local`，炎火云 VPS `/opt/nextchat` |
| 范围 | 品牌文案 + 禁用 SaaS 外链 + 视觉皮肤 + 聊天 chrome 打磨；**不**改 CPA/模型管线逻辑 |
| 原则 | 增量改造；优先 CSS 变量与文案；可独立合入的小 PR |
| 修订 | 2026-07-14 — 吸收 design-doc-review 全部 open issues |

---

## Overview

将本地 NextChat 分叉从「通用 ChatGPT 客户端 / nextchat.club SaaS 壳」收敛为**私有自托管**个人品牌 **MioChat**：现代、深色优先、中文优先、移动端友好。

本部署场景：炎火云 VPS + 机内 CPA 网关，访问码鉴权，**不是** nextchat.club 商业产品。因此除文案重命名外，必须**隐藏/禁用**一切导向 nextchat.club 的 onboarding CTA 与未授权营销外链，仅保留访问码与设置入口。

颜色、圆角、阴影通过**重映射现有 CSS 变量** + 新增 radius token 完成；侧栏/聊天窗/模型徽章/输入区/鉴权页形成统一「Mio 紫」识别。

**不改动**既有定制行为：

- `SITE_CONFIG.forceServerProxy` 强制服务端代理到 CPA
- `/api/upstream-models` 上游模型列表
- 顶栏 model badge + model picker（CPA · N、切换模型）
- 访问码 `nextchat-mio`、服务端 `OPENAI_API_KEY`

交付路径：本机构建 → `nextchat-yanhua:local` → `docker-compose.yanhua.yml` 部署。

---

## Goals / Non-Goals

### Goals

1. **品牌一致（默认语言 cn + en）**：用户可见 chrome / metadata / locale 壳层将 `NextChat` 改为 `MioChat`；副标题为 **`构建属于你自己的AI助手`**（无句号）。品牌条与 meta **固定中文**，不随 locale 切换。
2. **去掉 SaaS 误导**：Auth / Settings / 未授权错误中**不得**再跳转或链到 `nextchat.club`；保留访问码鉴权流程。
3. **视觉升级**：dark-first 的锁定紫色谱（对齐现有 badge 渐变蓝→紫），统一圆角/阴影/选中态。
4. **保留功能**：CPA 代理、模型拉取/切换、访问码流程零回归。
5. **移动端**：≤600px 下徽章、侧栏、输入区不溢出、不挤压标题。
6. **可增量发布**：按 PR 拆分，每 PR 可单独 review / 部署验证。
7. **低成本 PWA**：`site.webmanifest` 名称与 theme_color 对齐品牌；favicon 出图可后置。

### Non-Goals

- 不重写 React 路由、store、消息流、MCP/插件架构。
- 不改 CPA 网关、`BASE_URL`、`OPENAI_API_KEY`、`CODE` 等部署契约。
- 不强制翻译全部 20+ 语言 locale（**P0 = cn + en**；`tw` 与其余语言 **P1 批量**，接受短暂残留）。
- **不修改** `app/masks/*.ts` 预设内容、默认 system prompt 中的「ChatGPT」角色扮演指称（属内容非产品壳）。
- **不修改** `mcp-market.tsx` 请求 `https://nextchat.club/mcp/list` 的功能数据源（非品牌 chrome；若 MCP 市场启用，本迭代不改 API 主机）。
- 不重新设计桌面 Tauri 安装包图标体系。
- 不把 Docker 镜像名从 `nextchat-yanhua:local` 改成 miochat（部署脚本稳定；运行时品牌 = MioChat）。
- 不做完整 Design System / Storybook / 全站 a11y 审计（仅最低对比与 focus 验收）。
- 不引入新的语义 CSS token 体系（`--surface-*` / `--accent` 等）；本迭代只重映射现有变量。

---

## Current State

### 产品与部署

| 项 | 现状 |
|----|------|
| 路径 | `C:\Users\mio\study\NextChat` |
| 站点配置 | `app/config/site.ts`：`forceServerProxy`, `serverBaseUrl`, `preferredDefaultModel`, `upstreamLabel: "CPA"`；注释仍写「NextChat 服务端代理」 |
| Compose | `docker-compose.yanhua.yml` → **`image: nextchat-yanhua:local`**（**以 compose 为准**） |
| 部署说明 | `DEPLOY_YANHUA.md` 另处出现 `nextchat:local` 表述，与 compose **不一致**；修文档时统一为 `nextchat-yanhua:local` |
| 运行时品牌 | 仍为 NextChat + nextchat.club SaaS 入口 |

### 品牌硬编码（用户可见）

| 位置 | 当前文案 / 资产 |
|------|-----------------|
| `app/components/sidebar.tsx` | `title="NextChat"`，`subTitle="Build your own AI assistant."`，`logo={<ChatGptIcon />}`（绿标） |
| `app/layout.tsx` `metadata` | `title: "NextChat"`，`description: "Your personal ChatGPT Chat Bot."`，`appleWebApp.title: "NextChat"` |
| `public/site.webmanifest` | `name` / `short_name`: `NextChat`；`theme_color` / `background_color`: `#ffffff` |
| `app/components/exporter.tsx` | 导出卡片 `main-title`: `NextChat`；`sub-title`: `github.com/ChatGPTNextWeb/ChatGPT-Next-Web`（上游路径）；图标仍为 ChatGPT 资产 |
| `app/components/artifacts.tsx` | `NextChat Artifacts` |
| `app/store/update.ts` | 通知 title `"NextChat"`；icon 为 ChatGPT 资产 |
| `app/client/api.ts` | Share 文案含 `[NextChat]` + 上游 GitHub 链接 |
| `app/locales/cn.ts` / `en.ts` | Auth 促销、Settings SaaS、`Error.Unauthorized` 内嵌 SaaS UTM 链接 |
| `app/components/auth.tsx` | `goSaas()`、`TopBanner` → `SAAS_CHAT_URL`、`Auth.SaasTips` 按钮 |
| `app/components/settings.tsx` | `SaasStart` → `window.location.href = SAAS_CHAT_URL` |
| `src-tauri/tauri.conf.json` | `productName: "NextChat"`（桌面端，非本次主路径） |
| `app/mcp/logger.ts` | 前缀 `"NextChat MCP Client"`（控制台日志，非 UI） |

### 视觉系统

- 全局 token：`app/styles/globals.scss` 的 `@mixin light` / `@mixin dark`
  - `--primary: rgb(29, 147, 171)`（青绿）
  - dark：`--white: rgb(30,30,30)`，`--gray: rgb(21,21,21)`，`--second: rgb(27 38 42)`
  - 圆角分散（10 / 14 / 20 / 999px），无统一 radius token
- 壳层：`app/components/home.module.scss`
- 聊天：`app/components/chat.module.scss`
  - **model-badge**：`linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)` — **本迭代品牌渐变基准**
  - **model-picker**：硬编码 `#3b82f6`
- 鉴权：`auth.tsx` + `auth.module.scss`
- 全局 `*:focus-visible { outline: none; }` — 换色后需补可见 focus 环（见 a11y）

### 已定制且必须保留

- `SITE_CONFIG.forceServerProxy` → `app/client/api.ts`、`hooks.ts`、`platforms/openai.ts`
- `app/api/upstream-models/route.ts` + `app/utils/upstream-models.ts`
- 顶栏 badge / picker：`chat.tsx` ~L1759–1820 + `chat.module.scss`
- 服务端默认模型与 BASE_URL 兜底：`app/config/server.ts`

### 问题摘要

1. 品牌名仍是 NextChat；副标题英文；首屏仍是 ChatGPT 绿标。
2. SaaS 按钮/横幅/未授权文案会把用户送到 nextchat.club。
3. 全局 primary 青绿 vs badge 蓝紫 → 视觉分裂。
4. 部署文档镜像名与 compose 不一致。

---

## Alternatives considered

| 主题 | 选项 | 弃用原因 | 入选 |
|------|------|----------|------|
| 品牌注入 | A) 全仓库盲目字符串替换 B) 仅改 cn locale C) **`SITE_CONFIG` + TSX 引用，locale 字面量** | A 易误伤 masks/API 类名；B 漏 layout/sidebar | **C** |
| 色板策略 | A) 新建 `--surface-*` 语义层 B) 第三方 UI kit C) **只重映射现有 `--primary/--white/...` + `--radius-*`** | A 双轨成本高；B 过重 | **C** |
| SaaS 处理 | A) 仅改文案保留跳转 B) 环境变量开关 C) **隐藏/禁用 UI + 去外链（自用锁定）** | A 仍导向商业站；B 本部署恒为 true，多余 | **C** |
| Locale | A) 仅 cn B) 全量 20+ 同步 polish C) **P0 = cn+en，其余 P1 批量改名** | A 漏 en；B diff 过大 | **C** |
| Logo | A) 本迭代不改图标 B) 全套 favicon 重制 C) **侧栏 → BotIcon（P0）；favicon P2** | A 首屏仍像 ChatGPT；B 阻塞 | **C** |

---

## Proposed Design

### 1. 品牌定义

| 键 | 值（精确，已锁定） |
|----|-------------------|
| 产品名 | `MioChat` |
| 副标题 | `构建属于你自己的AI助手`（**无句号**） |
| meta description | `构建属于你自己的AI助手` |
| 品牌条 / meta 语言 | **固定中文**，不随 UI locale 切换 |
| upstream 展示标签 | `CPA`（功能标识，非产品名） |
| Docker 镜像名 | `nextchat-yanhua:local`（compose 为准） |
| Share 文案 | `Share from [MioChat]`（**不带** GitHub / nextchat.club 外链） |

在 `app/config/site.ts` 增加品牌字段（`site.ts` 无浏览器-only 依赖，**可被** `layout.tsx` 服务端 metadata 安全 import）：

```ts
// app/config/site.ts（增量字段）
export const SITE_CONFIG = {
  // ...existing forceServerProxy / serverBaseUrl / preferredDefaultModel /
  // modelsRefreshMs / upstreamLabel 逻辑不变...
  brandName: "MioChat",
  brandTagline: "构建属于你自己的AI助手",
} as const;
```

同步修改同文件注释：`强制走 NextChat 服务端代理` → `强制走本站服务端代理`。

#### 1.1 品牌数据来源矩阵（防再次漂移）

| 表面 | 数据来源 | 说明 |
|------|----------|------|
| 侧栏 title / subTitle | `SITE_CONFIG.brandName` / `brandTagline` | 必改 |
| `layout.tsx` metadata / appleWebApp | `SITE_CONFIG` | 服务端可 import |
| exporter 主标题、artifacts 标题、update 通知 title | `SITE_CONFIG.brandName`（artifacts 可用 `` `${SITE_CONFIG.brandName} Artifacts` ``） | 禁止再硬编码字面量（除 locale） |
| exporter 副标题（`.sub-title`） | `SITE_CONFIG.brandTagline` | **禁止**再写 `ChatGPTNextWeb` / 上游 GitHub / nextchat.club |
| locale（Auth/Settings/Error 等句子） | **字面量** `MioChat` | locale 为纯对象，不 import SITE_CONFIG |
| Share footer | 字面量 `Share from [MioChat]` | 与 SITE_CONFIG 同值；单行无外链 |
| MCP logger 前缀 | 可选改为 `MioChat MCP Client` | 非用户 UI；PR1 顺手改 |

**PR1 合并前 grep 要求**（`app/` 下 `*.ts` / `*.tsx`）：

```
NextChat
nextchat.club
SAAS_CHAT
ChatGPTNextWeb
ChatGPT-Next-Web
```

- **必须处理**：用户可见 chrome、locale 壳、外链 CTA、**exporter `.sub-title` 上游路径**。
- **允许残留**：`ChatGPTApi` 等类名、masks 内容、`NextChat-Awesome-Plugins` 等仓库 URL（非产品壳）、mcp list API host（Non-Goals）。

### 2. SaaS 入口行为（已锁定：隐藏/禁用）

**决策**：私有自托管部署下，**禁止**任何导向 `nextchat.club` / `SAAS_CHAT_URL` 的用户操作。保留访问码输入与「确认 / 返回 / 设置」路径。

| 位置 | 行为变更（精确） |
|------|------------------|
| `app/components/auth.tsx` | **不渲染** `TopBanner`（或渲染静态欢迎条且无链接）；**删除/不渲染** `SaasTips` 按钮及 `goSaas()` 调用；保留访问码 `PasswordInput` + 确认 |
| `app/components/settings.tsx` | **不渲染** `SaasStart` 整块（Title / Label / ChatNow）；勿保留「立刻对话」死按钮 |
| `app/locales/cn.ts` `Error.Unauthorized` | 去掉 `SAAS_CHAT_UTM_URL` 链接；改为纯文本引导访问码/设置 |
| `app/locales/en.ts` | 同上对称 |
| `constant.ts` 中 `SAAS_CHAT_URL` | 可保留常量定义（避免大范围删引用报错），但 **UI 不得使用**；若编译告警未使用可加注释 `// unused in self-host` |

实现偏好：**条件渲染 false / 直接删除 JSX 块**（本部署恒为自托管，不需要 `forceServerProxy` 再包一层开关，避免假开关）。若为减少 diff，可用 `const SHOW_SAAS_ONBOARDING = false` 单点开关，默认 false，**禁止**再设为 true 指向 club。

### 3. 文案替换表（用户可见，P0 = cn + en）

#### 3.1 Chrome / metadata（读 SITE_CONFIG 或字面量等价）

| 表面 | 文件 | 旧 | 新 |
|------|------|----|----|
| 侧栏标题 | `sidebar.tsx` | `NextChat` | `{SITE_CONFIG.brandName}` → `MioChat` |
| 侧栏副标题 | 同上 | `Build your own AI assistant.` | `{SITE_CONFIG.brandTagline}` → `构建属于你自己的AI助手` |
| 侧栏 logo | 同上 | `<ChatGptIcon />` | `<BotIcon />`（`app/icons/bot.svg`，auth 页已用） |
| 页面 title | `layout.tsx` | `NextChat` | `SITE_CONFIG.brandName` |
| description | 同上 | `Your personal ChatGPT Chat Bot.` | `SITE_CONFIG.brandTagline` |
| appleWebApp.title | 同上 | `NextChat` | `SITE_CONFIG.brandName` |
| PWA name | `site.webmanifest` | NextChat | MioChat |
| PWA 色 | 同上 | `#ffffff` | `#0f1117`（与 dark 底一致；themeColor 数值在 **PR2** 与 globals 对齐时再改 layout viewport，PR1 可只改 name） |
| 导出主标题 | `exporter.tsx` `.main-title` | `NextChat` | `{SITE_CONFIG.brandName}` → `MioChat` |
| 导出副标题 | `exporter.tsx` `.sub-title` | `github.com/ChatGPTNextWeb/ChatGPT-Next-Web` | **`{SITE_CONFIG.brandTagline}`** → `构建属于你自己的AI助手`（**锁定**；禁止上游 GitHub / fork URL / nextchat.club；不删除节点，保留导出卡层次） |
| 导出/通知图标 | `exporter.tsx` / `update.ts` | ChatGPT png | **P0**：改为 `bot.png` / `BotIcon` 同源资产；若无 png，暂时隐藏图标或用现有 `bot.png`（`app/icons/bot.png`） |
| Artifacts 标题 | `artifacts.tsx` | `NextChat Artifacts` | `` `${SITE_CONFIG.brandName} Artifacts` `` |
| 更新通知 title | `update.ts` | `NextChat` | `SITE_CONFIG.brandName` |
| 分享 footer | `api.ts` | `Share from [NextChat]: https://...` | `Share from [MioChat]`（无 URL） |

#### 3.2 Locale 壳层（cn 精确串；en 对称语义）

| 键 | 文件 | 旧（摘要） | 新（精确） |
|----|------|------------|------------|
| `Auth.TopTips` | `cn.ts` | NextChat AI 首发优惠… | `欢迎使用 MioChat` |
| `Auth.SaasTips` | `cn.ts` | 配置太麻烦，想要立即使用 | **键可保留**；UI 不渲染按钮。若需占位：`请使用访问码登录` |
| `Auth.Title` / `Tips` / `Input` | `cn.ts` | 需要密码 / 访问码… | **保留**（访问码流程） |
| `Settings.Access.SaasStart.Title` | `cn.ts` | 使用 NextChat AI | 键可留；**UI 不渲染**。若文案文件仍要填：`服务端已配置` |
| `Settings.Access.SaasStart.Label` | `cn.ts` | 由 NextChat 官方维护… | 同左策略 |
| `Settings.Access.SaasStart.ChatNow` | `cn.ts` | 立刻对话 | UI 不渲染 |
| `Error.Unauthorized` | `cn.ts` | 含 SaaS 链接的长营销句 | `未授权访问。请输入访问码后重试；如需配置请打开设置页。`（**无 HTML 外链**） |
| 同上各键 | `en.ts` | NextChat AI / SaaS | `Welcome to MioChat`；Unauthorized：`Unauthorized. Enter the access code and retry, or open Settings.`（无 club 链接） |

**Locale 范围**：

- **P0**：`cn.ts`、`en.ts`（上表全部键 + 任何残留用户可见 `NextChat`）。
- **P1**：其余 locale（含 `tw.ts`）批量 `NextChat` → `MioChat`，并尽量去掉 `nextchat.club` 用户可见 URL；接受 P0 上线后繁体短暂残留。
- **不做**：README 营销页大改。

侧栏按钮（面具 / 发现 / 新的聊天）已走 `Locale.*` 中文，**无需改键名**。

### 4. 视觉系统（单一策略：重映射现有变量）

**策略锁定（方案 C）**：本迭代**只**重写 `globals.scss` 中现有 `--primary`、`--second`、`--white`、`--gray`、`--black`、`--hover-color`、`--bar-color`、`--border-in-light`、`--shadow`、`--card-shadow`、`--theme-color`，并**仅新增** radius token。  
**不做** `--accent` / `--surface-0..2` / `--text-*` 新语义层（避免双轨）。

组件 scss 中的魔法色（`#3b82f6` 等）改为 `var(--primary)` 或下方写死的渐变起止 hex。

#### 4.1 新增 radius（`:root`）

```scss
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 999px;
  /* 既有 --window-width 等保留 */
}
```

#### 4.2 锁定色值（禁止「或」）

对齐现有 model-badge 渐变 **`#3b82f6 → #8b5cf6`**，主色取紫端作为全局 CTA 锚点。

**Dark（主推，精细 polish）**

| CSS 变量 | 锁定值 | 用途 |
|----------|--------|------|
| `--gray` | `#0f1117` | 页面最底背景 |
| `--white` | `#1a1d27` | 卡片、消息表面、列表项 |
| `--second` | `#151822` | 侧栏、输入区底 |
| `--primary` | `#8b5cf6` | 按钮、链接、选中边框、picker active（**单一主色，无备选**） |
| `--black` | `#e8eaf0` | 主文字（目标：相对 `--white` / `--gray` ≥ **WCAG AA 4.5:1**） |
| `--hover-color` | `#262a38` | 列表 hover |
| `--bar-color` | `rgba(255, 255, 255, 0.12)` | 滚动条 |
| `--border-in-light` | `1px solid rgba(255, 255, 255, 0.08)` | 细边框 |
| `--shadow` | `50px 50px 100px 10px rgba(0, 0, 0, 0.45)` | 窗口投影 |
| `--card-shadow` | `0px 2px 8px 0px rgba(0, 0, 0, 0.35)` | 卡片 |
| `--theme-color` | `var(--gray)` | 主题色 meta |

**次级文字**（无新 token）：组件内对副标题使用 `opacity: 0.65` 或 `color: rgba(232, 234, 240, 0.65)`，抽检对比 ≥ **3:1**（大文本/辅助）即可。

**Light（可读同步，非同等精细）**

| CSS 变量 | 锁定值 |
|----------|--------|
| `--primary` | `#7c3aed`（同色相略深，保证白底对比） |
| `--second` | `#f3f0ff` |
| `--gray` | `#f6f7fb` |
| `--white` | `#ffffff` |
| `--black` | `#1c1e26` |
| `--hover-color` | `#ece8ff` |
| `--border-in-light` | `1px solid rgb(222, 222, 228)` |
| `--shadow` / `--card-shadow` | 保持轻阴影，可略带紫灰 |

**主色 RGB 便于 rgba**（picker hover，**不用 color-mix**）：

```scss
// 实现时在组件 scss 使用固定 rgba，目标浏览器：最近两版 Chrome / Safari / Firefox
// primary dark #8b5cf6 → rgb(139, 92, 246)
$mio-primary-rgb: 139, 92, 246;
// hover 底：rgba($mio-primary-rgb, 0.12)
// active 底：rgba($mio-primary-rgb, 0.18)
```

**viewport themeColor**（**仅 PR2** 修改 `layout.tsx`，避免与 PR1 冲突）：

```ts
themeColor: [
  { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
  { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
],
```

**PWA**（PR1 改 name；`theme_color`/`background_color` 可在 PR1 一并改为 `#0f1117`，与上表一致）：

```json
{
  "name": "MioChat",
  "short_name": "MioChat",
  "theme_color": "#0f1117",
  "background_color": "#0f1117"
}
```

#### 4.3 组件级样式（无「或」）

1. **model-badge**（`chat.module.scss`）  
   - 背景**锁定**：`linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)`（与现网 badge 一致，作为品牌渐变；全局 `--primary` 取终点紫）。  
   - 文字：`#ffffff`。  
   - 阴影：`0 2px 10px rgba(139, 92, 246, 0.35)`。  
   - 保留 pill、`border-radius: var(--radius-pill)`、mobile 隐藏 `.model-badge-label`。

2. **model-picker**  
   - hover：`background: rgba(139, 92, 246, 0.12)`。  
   - active：`background: rgba(139, 92, 246, 0.18); color: var(--primary); font-weight: 700`。  
   - retry 按钮：`background: var(--primary); color: #fff`。  
   - panel：`border-radius: var(--radius-lg)`。  
   - **禁止** `color-mix()`；**禁止**残留 `#3b82f6` 作为 solid fill（渐变起色仅出现在 badge 一处）。

3. **消息气泡**  
   - **user**：背景 `var(--primary)`（`#8b5cf6`），文字 `#ffffff`。  
   - **assistant**：背景 `var(--white)`，边框 `var(--border-in-light)`，文字 `var(--black)`。  
   - 圆角：`var(--radius-md)`（12px）。

4. **输入条**  
   - `border-top: var(--border-in-light)`。  
   - textarea/focus：`outline: 2px solid var(--primary); outline-offset: 1px`（见 a11y）。  
   - 发送按钮：`background: var(--primary); color: #fff`。

5. **侧栏**  
   - `.chat-item-selected { border-color: var(--primary); }`。  
   - `.sidebar-title`：`font-weight: 700`。  
   - `.sidebar-sub-title`：`font-size: 12px; opacity: 0.65`。  
   - logo 已换 BotIcon；窄侧栏无需光晕（省略可选特效，减范围）。

6. **主容器**  
   - desktop `.container`：`border-radius: var(--radius-xl)`；`box-shadow: var(--shadow)`。  
   - mobile：保持全屏无圆角。

7. **鉴权页**  
   - 无 SaaS 横幅/按钮后，顶部可仅「返回」+ Bot 标 + 标题。  
   - `.auth-page` 内 input：`max-width: min(100%, 320px)`（覆盖全局 `max-width: 50%` 过窄问题）。

#### 4.4 无障碍 / 对比度最低标准（可勾选，非全站审计）

| # | 标准 |
|---|------|
| A1 | Dark：主文字 `#e8eaf0` on `#1a1d27` / `#0f1117` 目视清晰；侧栏副标题 opacity 0.65 仍可读 |
| A2 | 白字 `#ffffff` on badge 渐变与 on `--primary` 发送按钮：对比足够（紫底白字） |
| A3 | **Focus**：为 `.model-badge`、发送按钮、`.model-picker-close`、鉴权确认、主要 `IconButton` 提供可见 `focus-visible` 环（`2px solid var(--primary)` 或反色描边）；**不得**仅依赖被全局关掉的 outline 而无替代 |
| A4 | 不强制实现 `prefers-reduced-motion` 新逻辑；保留现有 animation，本迭代不新增长动画 |

---

### 5. 交互与 UX 细节

| 区域 | 行为 | 文案 |
|------|------|------|
| 模型徽章 | 点击打开 picker | `CPA · N` + 模型名 + `切换 ▾` |
| Picker | 现有中文 | `选择模型`；`共 N 个（CPA）`；加载/重试中文保留 |
| 侧栏 | 面具 / 发现 / 新的聊天 | Locale 中文 |
| Auth | 仅访问码 | `需要密码` / `在此处填写访问码`；**无**「立刻使用 SaaS」 |
| Settings | 无 SaasStart | 自定义接口等逻辑仍受 `forceServerProxy` 约束 |
| 空会话主题 | 不强制改 | `DEFAULT_TOPIC` |

**不引入**新导航结构。

### 6. Favicon / Logo

| 优先级 | 项 |
|--------|-----|
| **P0** | 侧栏 `ChatGptIcon` → `BotIcon`；exporter/update 尽量改用 bot 资产 |
| **P1** | —（原 P1 logo 已升 P0） |
| **P2** | 重导出 favicon / android-chrome（紫底白 M）；非阻塞 |

### 7. 不碰的代码路径（回归保护）

- `SITE_CONFIG` 业务字段逻辑不变（仅追加 brand + 注释）。
- `app/api/upstream-models/**`、`app/utils/upstream-models.ts` 控制流。
- `chat.tsx` 中 `openHeaderModelSelector`、`fetchAndApplyUpstreamModels`、模型列表 state 机：**禁止改控制流**；PR3 仅允许 className / 纯展示字符串（若必须）。
- `docker-compose.yanhua.yml` 端口与 env 键名。
- masks 内容；mcp-market 上游 list URL。

---

## UX/UI details

### 信息架构（不变）

```
[侧栏 BotIcon + MioChat + 副标题]
  [面具] [发现] [可选 MCP]
  [会话列表]
  [新的聊天] [设置…]
[主区]
  [主题标题 | 模型徽章 CPA·N | 工具按钮]
  [消息流]
  [输入条 + 发送]
```

鉴权页：返回 → Logo → 标题/提示 → 访问码 → 确认（**无** SaaS CTA）。

### 关键界面文案（最终）

| ID | 字符串 |
|----|--------|
| brand.name | MioChat |
| brand.tagline | 构建属于你自己的AI助手 |
| model.switch | 切换 ▾ |
| model.picker.title | 选择模型 |
| model.picker.loading | 正在从上游加载… |
| model.picker.count | 共 {n} 个（CPA） |
| auth.welcome | 欢迎使用 MioChat |
| auth.unauthorized | 未授权访问。请输入访问码后重试；如需配置请打开设置页。 |
| share.footer | Share from [MioChat] |
| export.mainTitle | MioChat |
| export.subTitle | 构建属于你自己的AI助手 |
| meta.title | MioChat |
| meta.description | 构建属于你自己的AI助手 |

### 视觉层次

1. 品牌紫 / 蓝紫渐变驱动 CTA 与徽章。  
2. 表面：底 `--gray` → 侧栏 `--second` → 卡片 `--white` → 浮层 picker。  
3. 动效：保留 `slide-in` 与 badge hover；不新增。  
4. 字体：沿用现有栈，不新增 webfont。

### Mobile（≤600px）

- 徽章隐藏 label；picker `width: min(440px, 100%)`。  
- 侧栏全屏滑入。  
- 输入条 flex-wrap；发送钮 primary 对比达标。

---

## Technical Approach

### 策略

```
PR1 品牌 + 去 SaaS 外链 + logo
  → PR2 全局色板 + radius + themeColor
  → PR3 chrome scss 对齐
  → PR4 长尾 locale + 部署文档
  → 发布检查单（附 DEPLOY，不单开空 PR）
```

### 实现步骤

1. `SITE_CONFIG` brand 字段 + 注释；sidebar / layout / exporter / artifacts / update 引用。  
2. `auth.tsx` / `settings.tsx` 隐藏 SaaS；locale Unauthorized 去链。  
3. 侧栏 BotIcon；share 文案。  
4. `globals.scss` 锁定色值 + radius；`layout` themeColor。  
5. `chat.module.scss` / `home.module.scss` / `auth.module.scss` 对齐。  
6. 其它 locale + `DEPLOY_YANHUA.md` 镜像名统一。  
7. 构建部署 + 手工回归脚本。

### 手工回归脚本（CPA / 代理 / 模型）

在部署实例上按序执行：

| 步骤 | 操作 | 预期 |
|------|------|------|
| R1 | 浏览器打开站点，无访问码时看错误/鉴权 | 文案无 nextchat.club 链接；可输入访问码 |
| R2 | 输入 `CODE`（默认 `nextchat-mio`）进入聊天 | 进入成功 |
| R3 | DevTools Network：发送一条消息 | 请求为同源 `/api/openai`（或站点代理路径），**无**浏览器直连 `host.docker.internal` / 外网 CPA |
| R4 | 点击顶栏模型徽章 | 出现 picker；XHR/fetch **`/api/upstream-models`**；列表非空时显示 `CPA · N` |
| R5 | 切换另一模型后发消息 | 会话使用新模型；无控制台 fetch 逻辑报错 |
| R6 | 打开设置页 | **无**「立刻对话 / NextChat AI」跳转；若仍显示自定义接口 UI，修改后行为仍被 `forceServerProxy` 忽略（请求仍走服务端） |
| R7 | 窄视口 ≤600px | 顶栏不溢出；徽章可点；侧栏可开关 |

**Code review 要点（PR3）**：diff 不得包含 `openHeaderModelSelector`、`fetchAndApplyUpstreamModels`、`selectorModelIds` 赋值逻辑的行为变更。

### 验收清单（品牌 / 视觉 / a11y）

- [ ] 标签与侧栏为 MioChat + 规定副标题  
- [ ] 侧栏为 BotIcon，非 ChatGPT 绿标  
- [ ] Auth / Settings / Unauthorized **无** nextchat.club 链接或跳转  
- [ ] dark/light 主色为锁定紫；badge 为蓝→紫渐变  
- [ ] A1–A3 对比与 focus 抽检通过  
- [ ] R1–R7 代理与模型回归通过  
- [ ] 导出预览主标题为 MioChat；副标题为规定 tagline（`构建属于你自己的AI助手`）  
- [ ] 导出预览 **无** `ChatGPTNextWeb` / `ChatGPT-Next-Web` / `nextchat.club` 字样  
- [ ] PWA name 为 MioChat  
- [ ] `app/` 内用户可见 `NextChat` 壳层 grep 清零（masks/类名除外）

### 构建

```powershell
$env:HTTP_PROXY  = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"
$env:ALL_PROXY   = "http://127.0.0.1:7890"
$env:NO_PROXY    = "localhost,127.0.0.1,::1"

yarn build
# 或
docker compose -f docker-compose.yanhua.yml build
docker compose -f docker-compose.yanhua.yml up -d
```

### 回滚

纯前端 + 条件渲染；回滚 commit 或上一镜像。无 DB migration。

---

## File / Module touchpoints

### 必改（P0）

| 文件 | 变更类型 |
|------|----------|
| `app/config/site.ts` | `brandName` / `brandTagline`；注释 |
| `app/components/sidebar.tsx` | 品牌字段 + **BotIcon** |
| `app/layout.tsx` | metadata（PR1）；themeColor（PR2） |
| `public/site.webmanifest` | name + 深色 theme/background |
| `app/components/auth.tsx` | **隐藏** TopBanner SaaS / SaasTips / goSaas |
| `app/components/settings.tsx` | **隐藏** SaasStart 块 |
| `app/locales/cn.ts` | TopTips、Unauthorized、SaaS 相关键、NextChat → MioChat |
| `app/locales/en.ts` | 同上 |
| `app/components/exporter.tsx` | `main-title` → brandName；`sub-title` → brandTagline；尽量换 bot 图标 |
| `app/components/artifacts.tsx` | 标题用 SITE_CONFIG |
| `app/store/update.ts` | 通知标题 + 图标 |
| `app/client/api.ts` | Share 无外链 |
| `app/styles/globals.scss` | 锁定色板 + radius |
| `app/components/chat.module.scss` | badge/picker/bubble/input |
| `app/components/home.module.scss` | 侧栏/列表/容器 |

### 建议改（随 PR3 / PR4）

| 文件 | 变更类型 |
|------|----------|
| `app/components/auth.module.scss` | 输入宽度、去横幅后的间距 |
| `app/styles/window.scss` | header 分割线用 border 变量 |
| `app/components/button.module.scss` | 圆角/阴影跟 token |
| `app/components/ui-lib.module.scss` | 弹层边框 |
| `app/locales/*.ts`（其余 + tw） | 批量改名 / 去 club 用户链 |
| `DEPLOY_YANHUA.md` | 产品名 MioChat；镜像名统一 `nextchat-yanhua:local`；附发布检查单 |
| `app/mcp/logger.ts` | 前缀 MioChat（可选） |

### 可选（P2）

| 文件 | 变更类型 |
|------|----------|
| `public/favicon*.png` 等 | 新图标 |
| `src-tauri/tauri.conf.json` | 桌面名 |
| `package.json` `name` | `miochat` |

### 明确不改

- `app/api/upstream-models/route.ts`
- `app/utils/upstream-models.ts`（控制流）
- `docker-compose.yanhua.yml` env 语义
- 消息 store / 流式解析
- `app/masks/**` 内容
- `mcp-market` 的 nextchat.club list API host

---

## Risks

| 风险 | 影响 | 缓解 |
|------|------|------|
| 隐藏 SaaS 后面板大块空白 | 低 | 直接不渲染整块，设置页自然上收 |
| 硬编码蓝紫残留 | 中 | PR3 grep `#3b82f6`（badge 渐变起点除外）、旧青 `rgb(29, 147, 171)` |
| dark 对比不足 | 中 | 验收 A1–A2；必要时把 `--black` 调到 `#f2f3f7` |
| focus 被全局 `outline: none` 吃掉 | 中 | A3 显式 focus-visible 规则 |
| tw 等语言短暂残留 NextChat | 低 | Goals 已限定 P0=cn+en；PR4 扫尾 |
| 部署文档镜像名错误 | 中 | PR4 统一为 `nextchat-yanhua:local` |
| 误改模型 fetch 控制流 | 高 | PR3 review 禁令 + R4/R5 |
| PWA 缓存旧 manifest | 低 | 重装/硬刷新 |
| 构建需代理 | 低 | `127.0.0.1:7890` |

---

## Open Questions

**本里程碑无阻塞开放问题。** 原 OQ 已全部收入 Key Decisions 或明确「本里程碑不做」：

| 原 OQ | 结论 |
|-------|------|
| Logo | **P0**：侧栏 BotIcon |
| SaaS | **隐藏/禁用**跳转与外链 |
| Light | dark 精细；light 同步 primary/second 保证可读 |
| Favicon 重制 | **P2**，本里程碑不做 |
| 镜像改名 miochat | **不做**；另开运维议题 |
| 副标题句号 | **无句号**：`构建属于你自己的AI助手` |

若未来要恢复 SaaS 开关或改镜像名，另开设计，不阻塞本迭代。

---

## Key Decisions

| # | 决策 | 理由 |
|---|------|------|
| 1 | 产品名 **MioChat**；副标题 **构建属于你自己的AI助手**（无句号） | 用户请求；中文品牌条固定 |
| 2 | 品牌条与 meta **固定中文**，不随 locale 切换 | 自用中文部署；避免 en UI 与中文 tagline 争论——接受 en UI 下品牌条仍中文 |
| 3 | `SITE_CONFIG.brandName` / `brandTagline` 为 TSX 品牌源；locale 用字面量 | 防 TSX 漂移；locale 纯对象不 import |
| 4 | **隐藏/禁用** Auth/Settings SaaS CTA 与 Unauthorized 中 club 外链；保留访问码 | 私有自托管，非 nextchat.club 产品 |
| 5 | **不改** CPA 代理、upstream-models、访问码、compose env | 已上线稳定 |
| 6 | 色板策略：**只重映射现有 CSS 变量** + `--radius-*`；主色 **`#8b5cf6`**；badge 渐变 **`#3b82f6 → #8b5cf6`** | 对齐现网 badge；无双轨 token |
| 7 | Picker hover 用 **rgba**，不用 color-mix | 兼容现代浏览器，实现简单 |
| 8 | Locale **P0 = cn + en**；tw 及其余 **P1** | 默认 cn；控制 diff |
| 9 | 侧栏 logo **P0 → BotIcon**；favicon **P2** | 首屏去 ChatGPT 绿标；出图不阻塞 |
| 10 | Share：`Share from [MioChat]` **无外链**；导出卡 `sub-title` → **brandTagline**（非上游 GitHub） | 分享/导出图均不导向上游或商业站，且保留副标题层次 |
| 11 | Docker 镜像名保持 `nextchat-yanhua:local`；文档以 compose 为准 | 部署稳定 |
| 12 | MCP market list API、masks 内容 **不改** | 非品牌壳 / 非本迭代 |
| 13 | Light 仅可读同步；dark 为 polish 重点 | 产品 dark-first |
| 14 | 最低 a11y：对比抽检 + focus-visible，非全站审计 | 与 polish 范围匹配 |
| 15 | 有序 PR：品牌去 SaaS → 色板 → chrome → 长尾；发布检查单写入 DEPLOY 而非空 PR | 可审可回滚 |

---

## PR Plan

### PR1 — 品牌、去 SaaS、logo（可独立上线）

- **Title**：`feat(brand): MioChat rename, hide SaaS CTAs, BotIcon`
- **Files**：
  - `app/config/site.ts`
  - `app/components/sidebar.tsx`（title/subTitle/BotIcon）
  - `app/layout.tsx`（**仅** metadata title/description/appleWebApp；**不改** themeColor）
  - `public/site.webmanifest`（name/short_name；theme 可同步 `#0f1117`）
  - `app/components/auth.tsx`
  - `app/components/settings.tsx`
  - `app/locales/cn.ts`
  - `app/locales/en.ts`
  - `app/components/exporter.tsx`
  - `app/components/artifacts.tsx`
  - `app/store/update.ts`
  - `app/client/api.ts`
  - 可选：`app/mcp/logger.ts` 前缀
- **Dependencies**：无
- **Description**：建立品牌字段；侧栏/metadata/导出/通知/share；**隐藏** Auth/Settings SaaS 跳转；Unauthorized 去 club 链；侧栏 BotIcon。`exporter.tsx`：`.main-title` = `SITE_CONFIG.brandName`，`.sub-title` = `SITE_CONFIG.brandTagline`（去掉 `github.com/ChatGPTNextWeb/ChatGPT-Next-Web`）。行为上禁止 nextchat.club onboarding。**不改**色板与模型逻辑。验收：grep 用户壳（含 exporter 无 ChatGPTNextWeb）、R1/R2/R6 文案与无外链、导出预览双行文案。

### PR2 — 全局色板与 radius

- **Title**：`style(theme): lock Mio purple palette and radius tokens`
- **Files**：
  - `app/styles/globals.scss`（**独占** light/dark 色值 + `:root` radius）
  - `app/layout.tsx`（**仅** viewport `themeColor`）
  - 可选：`app/styles/window.scss` 分割线
- **Dependencies**：建议 PR1 之后合并；可与 PR1 并行开发，但 **themeColor 只在本 PR 改**，避免冲突
- **Description**：写入锁定 hex；新增 radius。验收 dark/light 与 A1–A2 基础对比。

### PR3 — 聊天 chrome / 侧栏 / 鉴权样式

- **Title**：`style(chat): align chrome with Mio tokens`
- **Files**：
  - `app/components/chat.module.scss`（badge 渐变锁定、picker rgba、bubble、input）
  - `app/components/home.module.scss`
  - `app/components/auth.module.scss`
  - 按需：`button.module.scss`、`ui-lib.module.scss`
- **Dependencies**：**禁止先于 PR2 合并**
- **Description**：组件级对齐；**禁止**改 `chat.tsx` 模型控制流。验收 R3–R5、R7 与 A3 focus。

### PR4 — 长尾 locale、部署文档、发布检查单

- **Title**：`chore(brand): remaining locales and deploy doc alignment`
- **Files**：
  - `app/locales/{ar,bn,cs,da,de,es,fr,id,it,jp,ko,no,pt,ru,sk,tr,tw,vi}.ts`
  - `DEPLOY_YANHUA.md`：产品名 MioChat；镜像名统一 **`nextchat-yanhua:local`**；附录 **发布检查单**（原 PR5 内容：build、up -d、R1–R7、品牌验收）
  - 可选 P2 图标资源
- **Dependencies**：PR1（策略已定）；可与 PR3 并行
- **Description**：扫尾国际化；修正文档镜像名不一致；发布步骤文档化。**不单开无代码的「空 PR5」**。

### 合并与发布节奏

```
PR1 (品牌+去 SaaS+logo)
  └─► PR2 (色板) ─► PR3 (chrome) ─► 按 DEPLOY 检查单发布
  └─► PR4 (长尾+文档) 可与 PR3 并行
```

**硬约束**：PR3 不得先于 PR2 合并。资源紧时可一次构建部署 PR1–PR3，审查仍按边界拆分。

### 发布检查单（写入 DEPLOY_YANHUA.md，非独立 PR）

1. `docker compose -f docker-compose.yanhua.yml build`（镜像 `nextchat-yanhua:local`）  
2. 同步至 `/opt/nextchat` 并 `up -d`  
3. 执行手工回归 R1–R7  
4. 品牌/a11y 验收清单勾选  
5. 回滚：保留上一镜像 tag 或 compose 指回旧 image id  
