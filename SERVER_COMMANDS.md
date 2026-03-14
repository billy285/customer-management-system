# 服务器逐行执行命令清单（Ubuntu）

> 复制后按顺序执行即可。

## A. HTTP 快速上线

```bash
git clone <你的仓库地址> customer-management-system
cd customer-management-system
sudo bash scripts/bootstrap-server.sh
cp .env.example .env
```

编辑 `.env`（最少修改这 3 项）：

```dotenv
GHCR_OWNER=你的GitHub用户名
IMAGE_TAG=latest
APP_IMAGE=ghcr.io/${GHCR_OWNER}/customer-management-system:${IMAGE_TAG}
ENABLE_HTTPS=false
APP_PORT=8080
```

如镜像是私有仓库，执行：

```bash
docker login ghcr.io
```

部署与验证：

```bash
bash scripts/deploy.sh
curl -I http://127.0.0.1:8080
```

## B. HTTPS 正式上线

前置条件：域名已解析到服务器公网 IP，并放通 80/443 端口。

```bash
cd customer-management-system
sed -i 's/^ENABLE_HTTPS=.*/ENABLE_HTTPS=true/' .env
sed -i 's/^DOMAIN=.*/DOMAIN=crm.你的域名.com/' .env
sed -i 's/^TLS_EMAIL=.*/TLS_EMAIL=you@yourdomain.com/' .env
bash scripts/deploy.sh
curl -I https://crm.你的域名.com
```

## C. 运维命令

```bash
cd customer-management-system
docker compose --env-file .env -f docker-compose.prod.yml ps
docker compose --env-file .env -f docker-compose.prod.yml logs --tail=200
```
