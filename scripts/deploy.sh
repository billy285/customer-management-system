#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少命令: $1"
    exit 1
  fi
}

require_cmd docker
require_cmd curl

if ! docker compose version >/dev/null 2>&1; then
  echo "当前 Docker 不支持 compose 子命令，请先安装 docker compose plugin"
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "未找到 .env，请先复制 .env.example 并修改必要参数。"
  echo "命令：cp .env.example .env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [[ -z "${APP_IMAGE:-}" ]]; then
  echo "APP_IMAGE 未配置，请检查 .env"
  exit 1
fi

if [[ "${ENABLE_HTTPS:-false}" == "true" ]]; then
  if [[ -z "${DOMAIN:-}" || -z "${TLS_EMAIL:-}" ]]; then
    echo "启用 HTTPS 时，DOMAIN 和 TLS_EMAIL 不能为空"
    exit 1
  fi
fi

echo "[1/5] 拉取镜像：$APP_IMAGE"
docker pull "$APP_IMAGE"

echo "[2/5] 启动业务容器"
docker compose --env-file .env -f docker-compose.prod.yml up -d cms-web

if [[ "${ENABLE_HTTPS:-false}" == "true" ]]; then
  echo "[3/5] 启动 HTTPS 反代（Caddy）"
  docker compose --env-file .env -f docker-compose.prod.yml --profile https up -d caddy
else
  echo "[3/5] 停止可能存在的 HTTPS 反代（保持纯 HTTP）"
  docker compose --env-file .env -f docker-compose.prod.yml --profile https stop caddy >/dev/null 2>&1 || true
fi

echo "[4/5] 健康检查"
for i in {1..20}; do
  if curl -fsS "http://127.0.0.1:${APP_PORT:-8080}" >/dev/null; then
    echo "部署成功：应用可访问 http://127.0.0.1:${APP_PORT:-8080}"
    break
  fi
  sleep 2
done

if ! curl -fsS "http://127.0.0.1:${APP_PORT:-8080}" >/dev/null; then
  echo "部署后健康检查失败，请执行：docker compose --env-file .env -f docker-compose.prod.yml logs --tail=200"
  exit 1
fi

echo "[5/5] 当前容器状态"
docker compose --env-file .env -f docker-compose.prod.yml ps
