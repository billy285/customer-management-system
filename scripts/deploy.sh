#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "未找到 .env，请先复制 .env.example 并修改必要参数。"
  echo "命令：cp .env.example .env"
  exit 1
fi

set -a
source .env
set +a

if [[ -z "${APP_IMAGE:-}" ]]; then
  echo "APP_IMAGE 未配置，请检查 .env"
  exit 1
fi

echo "[1/4] 拉取镜像：$APP_IMAGE"
docker pull "$APP_IMAGE"

echo "[2/4] 启动业务容器"
docker compose --env-file .env -f docker-compose.prod.yml up -d cms-web

if [[ "${ENABLE_HTTPS:-false}" == "true" ]]; then
  echo "[3/4] 启动 HTTPS 反代（Caddy）"
  docker compose --env-file .env -f docker-compose.prod.yml --profile https up -d caddy
else
  echo "[3/4] 跳过 HTTPS（ENABLE_HTTPS=false）"
fi

echo "[4/4] 健康检查"
for i in {1..20}; do
  if curl -fsS "http://127.0.0.1:${APP_PORT:-8080}" >/dev/null; then
    echo "部署成功：应用可访问 http://127.0.0.1:${APP_PORT:-8080}"
    exit 0
  fi
  sleep 2
done

echo "部署后健康检查失败，请执行：docker compose --env-file .env -f docker-compose.prod.yml logs --tail=200"
exit 1
