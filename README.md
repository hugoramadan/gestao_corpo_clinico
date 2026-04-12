# Gestão de Corpo Clínico

Sistema web para gestão de profissionais de saúde.

**Stack:** Django 5 + DRF + SimpleJWT (backend) · React 18 + TypeScript + Vite + Tailwind (frontend) · PostgreSQL · Nginx · Docker

---

## Deploy em VPS Ubuntu (do zero)

### 1. Requisitos no servidor

```bash
# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Instale Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Verifique
docker --version
docker compose version
```

---

### 2. Clone o repositório

```bash
git clone https://github.com/hugoramadan/gestao_corpo_clinico.git
cd gestao_corpo_clinico
```

---

### 3. Crie o arquivo de variáveis de ambiente

```bash
cp deploy/.env.production.example .env.prod
nano .env.prod
```

Preencha todas as variáveis obrigatórias:

```env
# Django
SECRET_KEY=sua-chave-secreta-longa-e-aleatoria
DEBUG=False
ALLOWED_HOSTS=seudominio.com.br,www.seudominio.com.br
CSRF_TRUSTED_ORIGINS=https://seudominio.com.br,https://www.seudominio.com.br
CORS_ALLOWED_ORIGINS=https://seudominio.com.br,https://www.seudominio.com.br
FRONTEND_URL=https://seudominio.com.br
DOMAIN=seudominio.com.br

# Banco de dados
DB_ENGINE=django.db.backends.postgresql
DB_NAME=corpoclinico
DB_USER=corpoclinico
DB_PASSWORD=senha-forte-aqui

# E-mail (necessário para recuperação de senha)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.seuservidor.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu@email.com
EMAIL_HOST_PASSWORD=senha-do-smtp
DEFAULT_FROM_EMAIL=Corpo Clínico <noreply@seudominio.com.br>
```

Para gerar uma `SECRET_KEY` segura:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

### 4. Configure o domínio no nginx.conf

Edite `nginx/nginx.conf` e substitua `DOMAIN_PLACEHOLDER` pelo domínio real:

```bash
sed -i 's/DOMAIN_PLACEHOLDER/seudominio.com.br/g' nginx/nginx.conf
```

---

### 5. Emita o certificado SSL (Let's Encrypt)

Antes de subir o stack completo, o Nginx precisa do certificado. Suba apenas o HTTP temporariamente:

```bash
# Suba somente o nginx em modo HTTP (sem SSL) para validar o domínio
# Edite nginx/nginx.conf e comente temporariamente o bloco server { listen 443 ssl; ... }
# Depois suba:
docker compose -f docker-compose.prod.yml up -d nginx

# Emita o certificado via certbot
docker compose -f docker-compose.prod.yml --profile certbot run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d seudominio.com.br \
  -d www.seudominio.com.br \
  --email seu@email.com \
  --agree-tos \
  --no-eff-email

# Pare o nginx temporário
docker compose -f docker-compose.prod.yml down
```

Restaure o bloco SSL no `nginx/nginx.conf` caso tenha comentado.

---

### 6. Suba o stack completo

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Isso vai:
1. Subir o PostgreSQL
2. Rodar as migrations do Django
3. Coletar arquivos estáticos
4. Iniciar o Gunicorn
5. Buildar o frontend React e servir via Nginx

Verifique se tudo subiu:

```bash
docker compose -f docker-compose.prod.yml ps
```

---

### 7. Crie o primeiro usuário administrador

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py shell -c "
from accounts.models import CustomUser
u = CustomUser.objects.create_superuser(
    email='admin@seudominio.com.br',
    password='senha-inicial-forte'
)
u.roles = ['admin']
u.save()
print('Admin criado:', u.email)
"
```

Acesse `https://seudominio.com.br` e faça login.

---

### 8. Renovação automática do certificado SSL

Adicione um cron job para renovar o certificado mensalmente:

```bash
crontab -e
```

Adicione a linha:

```
0 3 1 * * cd /caminho/para/gestao_corpo_clinico && docker compose -f docker-compose.prod.yml --profile certbot run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## Atualizar o sistema após mudanças no código

```bash
cd gestao_corpo_clinico
git pull
docker compose -f docker-compose.prod.yml build --no-cache nginx backend
docker compose -f docker-compose.prod.yml up -d
```

---

## Comandos úteis

```bash
# Ver logs em tempo real
docker compose -f docker-compose.prod.yml logs -f

# Ver logs de um serviço específico
docker compose -f docker-compose.prod.yml logs backend --tail=50
docker compose -f docker-compose.prod.yml logs nginx --tail=50

# Acessar shell do Django
docker compose -f docker-compose.prod.yml exec backend python manage.py shell

# Rodar migrations manualmente
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Listar usuários
docker compose -f docker-compose.prod.yml exec backend python manage.py shell -c "
from accounts.models import CustomUser
for u in CustomUser.objects.all():
    print(u.id, u.email, u.roles, u.is_active)
"

# Trocar senha de um usuário
docker compose -f docker-compose.prod.yml exec backend python manage.py changepassword email@exemplo.com

# Reiniciar um serviço
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Desenvolvimento local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A API estará em `http://localhost:8000` e o frontend em `http://localhost:5173`.
