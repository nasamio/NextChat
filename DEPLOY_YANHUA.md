# 炎火云部署 MioChat（NextChat 分叉）

运行时产品名：**MioChat** · 副标题：构建属于你自己的AI助手  
镜像名（compose）：**`nextchat-yanhua:local`**

## 本机

- Fork：`https://github.com/nasamio/NextChat`
- 路径：`C:\Users\mio\study\NextChat`
- 设计文档：`docs/miochat-ui-design.md`

## 服务器

```bash
cd /opt/nextchat
# 编辑 .env 后
docker compose -f docker-compose.yanhua.yml up -d
# 或本机 build 后 docker save/load 再：
docker compose up -d --force-recreate
```

- 机内端口：`3000`
- 需 NAT：外部端口 → 内部 `3000`（协议 **tcp**）
- 访问密码：`.env` 的 `CODE`（默认 `nextchat-mio`）
- 上游 CPA：`BASE_URL=http://host.docker.internal:8317` + `OPENAI_API_KEY`
- `HIDE_USER_API_KEY=1`：禁止浏览器自带 Key，统一服务端 Key

## 网页使用

1. 打开 `http://公网IP:NAT端口`
2. 输入访问密码
3. **不要**填自定义 API Key / 自定义接口
4. 顶栏切换模型（CPA · N）

## 发布检查单

1. `docker build -t nextchat-yanhua:local .`（本机或 CI）
2. 上传镜像 → `/opt/nextchat` → `docker compose up -d --force-recreate`
3. 回归：
   - 侧栏显示 **MioChat** / **构建属于你自己的AI助手**
   - 无 nextchat.club SaaS 按钮
   - 访问码可登录
   - 模型列表可加载并切换
   - 对话正常（不报 own api key）
4. 回滚：compose 指回上一 image id

## 源码构建

```yaml
# docker-compose.yanhua.yml
services:
  nextchat:
    build: .
    image: nextchat-yanhua:local
```
