#!/usr/bin/env bash
# Script de atualização para produção com Docker
# Uso: bash deploy/deploy.sh
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> [1/4] Atualizando código"
git pull

echo "==> [2/4] Rebuilding imagens"
$COMPOSE build --pull

echo "==> [3/4] Subindo serviços (migrations e collectstatic rodam no startup do backend)"
$COMPOSE up -d --remove-orphans

echo "==> [4/4] Removendo imagens antigas"
docker image prune -f

echo "==> Deploy concluído!"
echo "    Logs: docker compose -f docker-compose.prod.yml logs -f"
