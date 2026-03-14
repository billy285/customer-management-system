# 客户管理系统上线部署（完整可执行版）

这是一个纯静态前端项目（HTML 文件），推荐用 Docker 容器部署。

本仓库已提供：
- 生产镜像构建：`Dockerfile` + `nginx.conf`
- 自动构建推送：`.github/workflows/deploy.yml`（推送到 GHCR）
- 服务器一键部署：`scripts/deploy.sh`
- 服务器初始化脚本：`scripts/bootstrap-server.sh`
- 生产编排：`docker-compose.prod.yml`
- 可选 HTTPS（自动证书）：`ops/Caddyfile`

---

## 0. 目录说明

- `Dockerfile`：打包静态站点到 Nginx
- `nginx.conf`：生产 Nginx 配置（安全头、压缩、缓存）
- `docker-compose.prod.yml`：生产部署编排（应用 + 可选 Caddy HTTPS）
- `.env.example`：部署参数模板
- `scripts/bootstrap-server.sh`：Ubuntu 初始化 Docker
- `scripts/deploy.sh`：一键拉镜像并启动

---

## 1. 本地验证（可选）

```bash
docker build -t customer-management-system:local .
docker run --rm -p 8080:80 customer-management-system:local
```

访问：`http://127.0.0.1:8080`

---

## 2. GitHub 自动发布镜像

工作流文件：`.github/workflows/deploy.yml`

触发条件：
- 推送到 `main`
- 手动触发 `workflow_dispatch`

产物镜像：
- `ghcr.io/<owner>/customer-management-system:latest`
- `ghcr.io/<owner>/customer-management-system:sha-xxxxxxx`

> 若仓库为私有，请确保目标服务器具备 GHCR 拉取权限（`docker login ghcr.io`）。

---

## 3. 服务器部署（Ubuntu，推荐）

### 3.1 上传代码到服务器

```bash
git clone <你的仓库地址> customer-management-system
cd customer-management-system
```

### 3.2 初始化服务器 Docker（首次）

```bash
sudo bash scripts/bootstrap-server.sh
```

### 3.3 配置部署参数

```bash
cp .env.example .env
```

编辑 `.env` 关键项：

```dotenv
GHCR_OWNER=你的GitHub用户名
IMAGE_TAG=latest
APP_IMAGE=ghcr.io/${GHCR_OWNER}/customer-management-system:${IMAGE_TAG}

ENABLE_HTTPS=false
DOMAIN=crm.yourdomain.com
TLS_EMAIL=you@yourdomain.com

APP_PORT=8080
HTTP_PORT=80
HTTPS_PORT=443
```

### 3.4 （如需私有镜像）登录 GHCR

```bash
docker login ghcr.io
```

### 3.5 一键部署

```bash
bash scripts/deploy.sh
```

---

## 4. 启用 HTTPS（可选）

把 `.env` 中以下项改成真实值：

```dotenv
ENABLE_HTTPS=true
DOMAIN=crm.yourdomain.com
TLS_EMAIL=you@yourdomain.com
```

然后重新执行：

```bash
bash scripts/deploy.sh
```

说明：
- Caddy 会自动申请与续签 Let’s Encrypt 证书
- 域名需要提前解析到服务器公网 IP
- 需确保 80/443 端口放通

---

## 5. 运维与回滚

### 查看状态

```bash
docker compose --env-file .env -f docker-compose.prod.yml ps
```

### 查看日志

```bash
docker compose --env-file .env -f docker-compose.prod.yml logs --tail=200
```

### 升级到新版本

```bash
# 修改 .env 中 IMAGE_TAG（例如 sha-xxxxxxx）
bash scripts/deploy.sh
```

### 回滚

```bash
# 把 IMAGE_TAG 改回旧版本
bash scripts/deploy.sh
```

---

## 6. 常见问题

1. **`pull access denied`**
   - 镜像不存在，或 GHCR 权限不足。

2. **HTTPS 证书申请失败**
   - 检查 `DOMAIN` 是否解析到当前服务器。
   - 检查 80/443 端口和云防火墙。

3. **页面无法访问**
   - 执行：
     ```bash
     docker compose --env-file .env -f docker-compose.prod.yml logs --tail=200
     ```

