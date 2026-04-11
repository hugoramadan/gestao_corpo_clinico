# CLAUDE.md — Contexto do Projeto

> **Instrução para o assistente:** Mantenha este arquivo sempre atualizado. Sempre que modificar código (novos endpoints, novas páginas, mudanças de modelo, regras de negócio, decisões de design), atualize as seções relevantes antes de encerrar a tarefa.

---

## Stack

- **Backend:** Django 5 + Django REST Framework + SimpleJWT — `backend/`
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS — `frontend/`
- **Banco de dados (dev):** SQLite
- **Arquivos de mídia:** `backend/media/`

---

## Estrutura de pastas relevante

```
backend/
  accounts/       — CustomUser, autenticação, gestão de usuários
  medicos/        — Medico, Especialidade, MedicoEspecialidade (comprovantes)
  core/           — urls.py principal
frontend/src/
  api/            — axios.ts (interceptor JWT), medicos.ts, users.ts
  contexts/       — AuthContext (login, logout, isRole, refreshUser)
  components/     — Navbar, ProtectedRoute, MedicoForm, FileUploadField
  pages/          — todas as páginas (ver lista abaixo)
  types/          — index.ts (AuthUser, User, Medico, etc.)
```

---

## Páginas existentes

| Rota | Página | Acesso |
|---|---|---|
| `/login` | Login.tsx | público |
| `/cadastro` | Registro.tsx | público |
| `/dashboard` | Dashboard.tsx | autenticado |
| `/trocar-senha` | TrocarSenha.tsx | autenticado |
| `/perfil` | Perfil.tsx | medico |
| `/medicos` | MedicoLista.tsx | gestor, admin |
| `/medicos/:id` | MedicoDetalhe.tsx | gestor, admin |
| `/medicos/:id/editar` | MedicoEditar.tsx | gestor, admin |
| `/usuarios` | UsuarioLista.tsx | admin |
| `/usuarios/novo` | UsuarioNovo.tsx | admin |
| `/usuarios/:id/editar` | UsuarioEditar.tsx | admin |

> **Removida:** `/medicos/novo` — criação de médico agora é exclusivamente via `/usuarios/novo` (role=medico).

---

## Endpoints da API

### Auth (`/api/auth/`)
| Método | Rota | Descrição |
|---|---|---|
| POST | `login/` | JWT login — retorna `access`, `refresh`, `user` (com `must_change_password`) |
| POST | `register/` | Auto-cadastro médico (`must_change_password=False`) |
| GET | `me/` | Dados do usuário autenticado |
| POST | `change-password/` | Troca senha (exige `current_password`; seta `must_change_password=False`) |
| POST | `password-reset/` | Solicita recuperação por e-mail |
| POST | `password-reset/confirm/` | Confirma token e redefine senha |

### Médicos (`/api/medicos/`)
| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `` | Lista / cria registro Medico puro (sem User) |
| GET/PATCH | `{id}/` | Detalhe / edição |
| GET/POST | `{id}/comprovantes/` | Comprovantes de especialidade |
| GET/POST | `especialidades/` | Especialidades disponíveis |

### Usuários (`/api/users/`) — admin only
| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `` | Lista / cria usuário (POST role=medico cria User+Medico atomicamente) |
| GET/PATCH/DELETE | `{id}/` | Detalhe / edição / exclusão (admin não pode se auto-excluir — HTTP 403) |

---

## Modelos importantes

### CustomUser (`accounts/models.py`)
- Login por e-mail (não username)
- `role`: `medico` | `gestor` | `admin`
- `must_change_password: BooleanField(default=False)` — `True` em usuários criados por admin

### Medico (`medicos/models.py`)
- `user`: FK para CustomUser (nullable — médicos sem login têm `user=null`)
- `cpf`: `null=True, blank=True, unique=True` — admin pode criar sem CPF; NULL não colide com UNIQUE

---

## Regras de negócio

- **Criar médico com login:** SEMPRE via `POST /api/users/` (role=medico). Isso cria User + Medico atomicamente via `UserCreateSerializer` com `@transaction.atomic`.
- **Senha provisória:** Todo usuário criado por admin recebe `must_change_password=True`. Auto-registro recebe `False`.
- **Troca forçada:** `ProtectedRoute` redireciona qualquer rota para `/trocar-senha` se `must_change_password=True`. Após trocar, `must_change_password` é setado para `False`.
- **Auto-exclusão bloqueada:** Admin não pode excluir a própria conta. Implementado em duas camadas: backend (HTTP 403 em `UserDetailView.destroy()`) e frontend (guard no `handleDelete` + botão oculto).
- **Auto-edição restrita:** `UserManagementSerializer` impede que o usuário altere seu próprio `role` ou `is_active`.

---

## Migrations aplicadas

| App | Migration |
|---|---|
| accounts | 0001_initial |
| accounts | 0002_must_change_password |
| medicos | 0001..0007 (legado) |
| medicos | 0008_cpf_nullable |

---

## Usuários de teste (dev)

| E-mail | Senha | Role |
|---|---|---|
| admin@teste.com | admin123 | admin |
| gestor@teste.com | gestor123 | gestor |
| medico@teste.com | medico123 | medico |
