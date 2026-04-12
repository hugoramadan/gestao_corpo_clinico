# Stage 1: build do frontend React
FROM node:20-alpine AS frontend-build

WORKDIR /app
# O contexto de build é a raiz do projeto (definido no docker-compose.prod.yml)
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# Stage 2: nginx com o frontend compilado
FROM nginx:1.27-alpine

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a config personalizada
COPY nginx/nginx.conf /etc/nginx/conf.d/corpoclinico.conf

# Copia o frontend compilado do stage anterior
COPY --from=frontend-build /app/dist /var/www/frontend

EXPOSE 80 443
