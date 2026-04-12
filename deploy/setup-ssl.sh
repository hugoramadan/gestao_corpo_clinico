#!/usr/bin/env bash
# Executa UMA VEZ no primeiro deploy para emitir o certificado SSL via certbot
# Uso: bash deploy/setup-ssl.sh seu-dominio.com.br email@exemplo.com
set -euo pipefail

DOMAIN=${1:?"Informe o domínio. Uso: $0 clinica.exemplo.com.br email@exemplo.com"}
EMAIL=${2:?"Informe o e-mail. Uso: $0 clinica.exemplo.com.br email@exemplo.com"}
COMPOSE="docker compose -f docker-compose.prod.yml"

# 1. Garante que os volumes do certbot existem
$COMPOSE run --rm certbot true 2>/dev/null || true

# 2. Sobe somente o nginx em modo HTTP (sem SSL) para o desafio ACME
echo "==> Subindo nginx (HTTP apenas) para desafio ACME..."
# Comenta temporariamente o bloco SSL do nginx para subir sem certificado
$COMPOSE up -d nginx

# 3. Emite o certificado
echo "==> Emitindo certificado para $DOMAIN..."
$COMPOSE run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# 4. Substitui DOMAIN_PLACEHOLDER no nginx.conf pelo domínio real
echo "==> Atualizando nginx.conf com o domínio $DOMAIN..."
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx.conf

# 5. Rebuild do nginx para incluir o config atualizado e sobe tudo
echo "==> Rebuild do nginx com SSL..."
$COMPOSE build nginx
$COMPOSE up -d

echo ""
echo "==> SSL configurado com sucesso para $DOMAIN!"
echo "    Para renovação automática, adicione ao crontab:"
echo "    0 3 * * * cd $(pwd) && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload"
