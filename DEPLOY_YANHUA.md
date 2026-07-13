# 炎火云部署 NextChat

## 本机

- Fork：`https://github.com/nasamio/NextChat`
- 路径：`C:\Users\mio\study\NextChat`

## 服务器

```bash
cd /opt/nextchat
# 编辑 .env 后
docker compose -f docker-compose.yanhua.yml up -d
docker compose -f docker-compose.yanhua.yml logs -f --tail=50
```

- 机内端口：`3000`
- 需 NAT：外部端口 → 内部 `3000`（协议 **tcp**）
- 默认访问密码：`.env` 里的 `CODE`（初始 `nextchat-mio`）
- 默认上游：机内 CPA `http://host.docker.internal:8317`

## 网页使用

1. 打开 `http://公网IP:NAT端口`
2. 输入访问密码 `CODE`
3. 设置里填 **API Key**（CPA 的 key），需要时可改自定义接口
4. 聊天测试；模型列表视上游 `/v1/models` 与客户端设置而定

## 后续用本仓库源码构建

把 `docker-compose.yanhua.yml` 中 `image:` 换成：

```yaml
build: .
image: nextchat:local
```

在内存更大的机器上 `docker compose build` 后再推镜像，或本机 build 后 `docker save` 上传。
