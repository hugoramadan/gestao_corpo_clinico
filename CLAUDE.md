# CLAUDE.md — Contexto do Projeto

> **Instrução para o assistente:** Mantenha este arquivo sempre atualizado. Sempre que modificar código (novos endpoints, novas páginas, mudanças de modelo, regras de negócio, decisões de design), atualize as seções relevantes antes de encerrar a tarefa.

---

## Stack

- **Backend:** Django 5 + Django REST Framework + SimpleJWT — `backend/`
- **Frontend:** React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 — `frontend/`
- **Banco de dados (dev):** SQLite · **(prod):** PostgreSQL 16
- **Arquivos de mídia:** `backend/media/`
- **Deploy:** Docker Compose (`docker-compose.prod.yml`) — Nginx + Gunicorn + PostgreSQL

### Versões principais (package.json / requirements.txt)
| Lib | Versão |
|---|---|
| React | 19.2.4 |
| TypeScript | 6.0.2 |
| Vite | 8.0.4 |
| Tailwind CSS | 4.2.2 |
| React Router | 7.14.0 |
| Axios | 1.15.0 |
| React Hook Form | 7.72.1 |
| Zod | 4.3.6 |
| React Hot Toast | 2.6.0 |
| Django | >=5.0,<6.0 |
| DRF | >=3.15 |
| SimpleJWT | >=5.3 |

---

## Estrutura de pastas relevante

```
backend/
  accounts/       — CustomUser, Funcionario, autenticação, gestão de usuários
    models.py     — CustomUser, Funcionario
    views.py      — endpoints de auth + user management
    serializers.py
    urls.py       — /api/auth/ routes
    user_urls.py  — /api/users/ routes
  medicos/        — Medico, Especialidade, MedicoEspecialidade (comprovantes)
    models.py     — Medico (60+ campos), Especialidade, MedicoEspecialidade
    permissions.py — IsGestorOrAdmin, IsAdminOnly, IsMedicoOwnerOrStaff
  core/
    urls.py       — roteamento principal
    configuracao.py — Configuracao singleton + views
    validators.py — validate_cpf_digits()
    settings.py   — JWT 8h/7d, CORS, SMTP, media, frontend URL
frontend/src/
  api/            — axios.ts (interceptor JWT), medicos.ts, users.ts, config.ts
  contexts/       — AuthContext (login, logout, isRole, refreshUser), ConfigContext
  components/     — Navbar, ProtectedRoute, MedicoForm, FileUploadField, CadastroIncompletoAviso
  pages/          — todas as páginas (ver lista abaixo)
  types/          — index.ts (AuthUser, User, Medico, etc.)
  utils/
    media.ts      — mediaUrl(): corrige URLs absolutas do backend
    roles.ts      — ROLE_LABEL dict e ROLE_OPTIONS array
```

---

## Páginas existentes

| Rota | Página | Acesso |
|---|---|---|
| `/login` | Login.tsx | público |
| `/cadastro` | Registro.tsx | público |
| `/esqueci-senha` | EsqueciSenha.tsx | público |
| `/redefinir-senha` | RedefinirSenha.tsx | público |
| `/dashboard` | Dashboard.tsx | autenticado |
| `/trocar-senha` | TrocarSenha.tsx | autenticado |
| `/perfil` | Perfil.tsx | medico |
| `/medicos` | MedicoLista.tsx | gestor, admin |
| `/medicos/:id` | MedicoDetalhe.tsx | autenticado (backend protege acesso cruzado) |
| `/medicos/:id/editar` | MedicoEditar.tsx | autenticado (backend protege acesso cruzado) |
| `/usuarios` | UsuarioLista.tsx | admin |
| `/usuarios/novo` | UsuarioNovo.tsx | **admin, gestor** |
| `/usuarios/:id/editar` | UsuarioEditar.tsx | admin |
| `/configuracoes` | Configuracoes.tsx | admin |

> **Arquivo órfão:** `MedicoNovo.tsx` existe em `frontend/src/pages/` mas **não está registrado em `App.tsx`** (removido do roteamento). Não usar — criação de médico com login é via `/usuarios/novo` (role=medico).

---

## Endpoints da API

### Auth (`/api/auth/`)
| Método | Rota | Descrição |
|---|---|---|
| POST | `login/` | JWT login — retorna `access`, `refresh`, `user` (com `must_change_password`) |
| POST | `refresh/` | Renova token de acesso via `refresh` |
| POST | `register/` | Auto-cadastro médico (`must_change_password=False`) — cria User + Medico atomicamente |
| GET | `me/` | Dados do usuário autenticado |
| POST | `change-password/` | Troca senha (exige `current_password`; seta `must_change_password=False`) |
| POST | `password-reset/` | Solicita recuperação por e-mail (envio assíncrono via `threading.Thread`) |
| POST | `password-reset/confirm/` | Confirma `uid`/`token` e redefine senha |

### Médicos (`/api/medicos/`)
| Método | Rota | Descrição |
|---|---|---|
| GET | `` | Lista médicos — gestor/admin; aceita `?search=` e `?status=ativo,inativo` |
| POST | `` | Cria registro Medico puro (sem User) — autenticado |
| GET | `me/` | Perfil do médico autenticado — role medico only |
| GET | `{id}/` | Detalhe do médico |
| PATCH | `{id}/` | Edição (dono ou staff) — `multipart/form-data` para arquivos |
| DELETE | `{id}/` | Exclui médico inativo — admin only |
| GET/POST | `{id}/comprovantes/` | Lista / adiciona comprovante de especialidade |
| DELETE | `{id}/comprovantes/{cid}/` | Remove comprovante de especialidade |
| GET/POST | `especialidades/` | Especialidades disponíveis |

### Usuários (`/api/users/`)
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `` | admin | Lista usuários; aceita `?search=` e `?status=ativo,inativo` |
| POST | `` | **admin, gestor** | Cria User+Medico ou User+Funcionario atomicamente (`@transaction.atomic`) |
| GET | `{id}/` | admin | Detalhe do usuário |
| PATCH | `{id}/` | admin | Edição, troca de roles, sincroniza Medico/Funcionario |
| DELETE | `{id}/` | admin | Exclui usuário (só se status `inativo`) |

### Configuração (`/api/config/`)
| Método | Rota | Descrição |
|---|---|---|
| GET | `` | Retorna configuração atual — **público** (sem autenticação) |
| PATCH | `` | Atualiza configuração — admin only; aceita `multipart/form-data` (logo) |

> A configuração é um **singleton** (pk=1). Campos: `nome`, `subtitulo`, `cor_primaria`, `logo`. Para remover a logo, enviar `remover_logo=1` no payload.

---

## Modelos importantes

### CustomUser (`accounts/models.py`)
- Login por e-mail (não username)
- `roles`: `JSONField` — lista de perfis. Ex: `["medico"]`, `["admin", "medico"]`, `["gestor", "medico"]`
  - Valores válidos: `medico`, `gestor`, `admin`
  - Um usuário pode ter múltiplos perfis simultaneamente
- `must_change_password: BooleanField(default=False)` — `True` em usuários criados por admin
- `has_role(role)`: método auxiliar de verificação

### Funcionario (`accounts/models.py`)
- Perfil básico para usuários sem papel de médico (gestores, admins)
- `user`: OneToOneField para CustomUser
- `cpf`: `null=True, blank=True, unique=True`
- `data_nascimento`, `email`, `status` (`ativo` / `inativo`)
- Criado automaticamente para cada usuário existente que não seja médico (migration 0005)
- Criado também via `UserCreateSerializer` quando role não inclui `medico`

### Medico (`medicos/models.py`)
- `user`: FK para CustomUser (nullable — médicos sem login têm `user=null`)
- `cpf`: `null=True, blank=True, unique=True` — admin pode criar sem CPF; NULL não colide com UNIQUE
- **Campos pessoais:** `nome_completo`, `cpf`, `data_nascimento`, `rg_numero`, `estado_civil`, `foto_perfil`, `email`, `telefone`
- **Endereço:** `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado`
- **Formação:** `instituicao_formacao`, `ano_formatura`, `link_lattes`
- **CRM:** `crm_numero`, `crm_estado`, ManyToMany `especialidades` via `MedicoEspecialidade`
- **Financeiro:** `tipo_chave_pix` (cpf/cnpj/email/telefone/aleatoria), `chave_pix`
- **Documentos (FileField):** `diploma`, `crm_doc`, `rg_cpf` (RG+CPF frente/verso), `cnh`, `comprovante_endereco`, `quitacao_crm`, `etica_crm`, `certidao_casamento`, `curriculo_lattes`
- **Status:** `pendente` / `ativo` / `inativo`
- **Timestamps:** `created_at`, `updated_at`
- `campos_pendentes()`: retorna lista de `{campo, label}` incompletos; certidão de casamento só obrigatória para `estado_civil` que comece com `"casado"`; exige ao menos 1 especialidade
- `cadastro_completo()`: `len(campos_pendentes()) == 0`

### Configuracao (`core/configuracao.py`)
- Singleton (pk=1) — acessado via `Configuracao.get()`
- `nome`, `subtitulo`, `cor_primaria` (hex), `logo` (ImageField)
- Cor primária é aplicada como CSS variable `--color-primary` pelo `ConfigContext` no frontend

---

## Regras de negócio

- **Criar médico com login:** SEMPRE via `POST /api/users/` (role=medico). Isso cria User + Medico atomicamente via `UserCreateSerializer` com `@transaction.atomic`.
- **Gestor cria apenas médicos:** `UserCreateSerializer.validate_roles` bloqueia gestores de criar usuários com roles diferentes de `medico` (HTTP 400). Admins podem criar qualquer role.
- **Senha provisória:** Todo usuário criado por admin/gestor recebe `must_change_password=True`. Auto-registro recebe `False`.
- **Troca forçada:** `ProtectedRoute` redireciona qualquer rota para `/trocar-senha` se `must_change_password=True`. Após trocar, `must_change_password` é setado para `False`.
- **Auto-exclusão bloqueada:** Admin não pode excluir a própria conta. Implementado em duas camadas: backend (HTTP 403 em `UserDetailView.destroy()`) e frontend (guard no `handleDelete` + botão oculto).
- **Exclusão restrita:** Usuário só pode ser excluído se status for `inativo`.
- **Auto-edição restrita:** `UserManagementSerializer` impede que o usuário altere seus próprios `roles` ou `is_active`.
- **Sincronização User↔Medico:** Quando admin altera `is_active` de um usuário médico, `Medico.status` é sincronizado (inativo↔ativo). Médico que edita o próprio perfil e torna o cadastro incompleto regride de `ativo` para `pendente`.
- **Filtro de status na lista de usuários:** Filtrar `?status=ativo` inclui médicos com status `pendente` (considerados ativos no sistema).
- **Reconciliação de roles:** `UserManagementSerializer.update()` cria/vincula `Medico` se role `medico` foi adicionada; desvincula e marca `inativo` se removida. Cria `Funcionario` se necessário para não-médicos.
- **CPF:** Validado via `validate_cpf_digits()` em `core/validators.py` (algoritmo oficial, dois dígitos verificadores). Único entre `Medico` e entre `Funcionario`.
- **Email de recuperação de senha:** Enviado em `threading.Thread` para evitar bloqueio da requisição (backend síncrono).

---

## Serializers principais (`accounts/serializers.py`, `medicos/serializers.py`)

| Serializer | Uso |
|---|---|
| `CustomTokenObtainPairSerializer` | Adiciona `nome`, `email`, `roles`, `must_change_password` ao token JWT |
| `RegisterSerializer` | Auto-cadastro público — cria User(roles=['medico']) + Medico atomicamente |
| `UserSerializer` | Leitura de dados do usuário com `funcionario` e `status` computado |
| `UserCreateSerializer` | Admin/gestor cria usuário; valida CPF, roles, cria Medico ou Funcionario |
| `UserManagementSerializer` | Admin edita usuário; sincroniza roles↔Medico/Funcionario |
| `ChangePasswordSerializer` | Valida senha atual + confirmação da nova |
| `MedicoListSerializer` | Listagem leve (sem arquivos) |
| `MedicoSerializer` | Completo; campos computados: `campos_pendentes`, `cadastro_completo`, `comprovantes_especialidade` |
| `MedicoEspecialidadeSerializer` | Com `especialidade_nome` |

---

## Migrations aplicadas

| App | Migration |
|---|---|
| accounts | 0001_initial |
| accounts | 0002_must_change_password |
| accounts | 0003_roles_field (role → roles JSONField + data migration) |
| accounts | 0004_funcionario_model (cria model Funcionario) |
| accounts | 0005_criar_funcionarios_existentes (data migration: cria Funcionario para users existentes) |
| medicos | 0001..0007 (legado — campos, documentos, RG/CPF consolidação, curriculo_lattes) |
| medicos | 0008_cpf_nullable (CPF nullable + verbose names em campos de documento) |
| core | 0001_configuracao (cria model Configuracao singleton) |

---

## Fluxo de autenticação (frontend)

1. Tokens armazenados em `localStorage` (`access_token`, `refresh_token`)
2. `axios.ts` adiciona `Authorization: Bearer {access_token}` em toda requisição
3. Resposta 401 aciona refresh automático (`POST /auth/refresh/`); em caso de falha redireciona para `/login`
4. `AuthContext` expõe: `user`, `loading`, `login()`, `logout()`, `isRole()`, `refreshUser()`
5. `ProtectedRoute` verifica autenticação + `must_change_password` + roles; redireciona conforme necessário

---

## Usuários de teste (dev)

| E-mail | Senha | Role |
|---|---|---|
| admin@teste.com | admin123 | admin |
| gestor@teste.com | gestor123 | gestor |
| medico@teste.com | medico123 | medico |

---

## Produção

- **Domínio:** hugoramadan.com.br
- **Variáveis de ambiente:** `.env.prod` na raiz do projeto (não versionado)
- **SSL:** Let's Encrypt — certificado em `/etc/letsencrypt/live/hugoramadan.com.br/`
- **nginx.conf:** `nginx/nginx.conf` — `/static/` (30d cache), `/media/` (7d cache), `/api/` e `/admin/` proxy para gunicorn, `/` SPA fallback; `client_max_body_size 20M`
- **Frontend:** buildado dentro da imagem Docker do Nginx (multi-stage build em `nginx/Dockerfile`). Rebuild necessário após qualquer mudança no frontend ou no `nginx.conf`:
  ```bash
  docker compose -f docker-compose.prod.yml build --no-cache nginx && docker compose -f docker-compose.prod.yml up -d nginx
  ```
- **Título da aba:** `frontend/index.html` — "Cadastro médico", sem favicon
- **ConfigContext:** aplica `--color-primary` imediatamente com o valor padrão antes de carregar a API, evitando elementos invisíveis no carregamento inicial; tolera falha da API sem quebrar o app

### Variáveis de ambiente relevantes (backend)
| Variável | Uso |
|---|---|
| `DEBUG` | `True`/`False` |
| `SECRET_KEY` | Django secret key |
| `DB_*` | `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` (PostgreSQL prod) |
| `ALLOWED_HOSTS` | Domínios permitidos |
| `CORS_ALLOWED_ORIGINS` | Origens do frontend |
| `CSRF_TRUSTED_ORIGINS` | Origens CSRF confiáveis |
| `FRONTEND_URL` | Domínio usado nos links de redefinição de senha |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` | SMTP para envio de e-mails |

### Notas importantes de deploy
- O `nginx.conf` **não deve ser editado diretamente no servidor** — editar localmente, commitar e fazer `git pull` + rebuild
- O arquivo `.env.prod` fica apenas no servidor (não versionado). Contém `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS` com o domínio de produção
- Criar primeiro admin em produção via `manage.py shell` com `roles = ['admin']` — `createsuperuser` cria sem roles e o usuário não aparece no sistema
- **Dev com Docker:** `docker-compose.yml` sobe backend (porta 8000) + frontend Vite (porta 5173, proxy via `VITE_API_TARGET=http://backend:8000`)
