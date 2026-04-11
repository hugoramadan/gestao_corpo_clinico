import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';

const ROLE_LABEL: Record<string, string> = {
  medico: 'Médico',
  gestor: 'Gestor',
  admin: 'Administrador',
};

export default function Navbar() {
  const { user, logout, isRole } = useAuth();
  const { nome, logoUrl } = useConfig();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="text-white shadow-md" style={{ backgroundColor: 'var(--color-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-7 w-auto object-contain" />
          )}
          <span className="text-lg font-bold tracking-tight">{nome}</span>
        </Link>

        <div className="flex items-center gap-4">
          {isRole('gestor', 'admin') && (
            <Link to="/medicos" className="text-sm hover:underline">
              Médicos
            </Link>
          )}
          {isRole('medico') && (
            <Link to="/perfil" className="text-sm hover:underline">
              Meu Cadastro
            </Link>
          )}
          {isRole('gestor') && !isRole('admin') && (
            <Link to="/usuarios/novo" className="text-sm hover:underline">
              Novo Médico
            </Link>
          )}
          {isRole('admin') && (
            <Link to="/usuarios" className="text-sm hover:underline">
              Usuários
            </Link>
          )}
          {isRole('admin') && (
            <Link to="/configuracoes" className="text-sm hover:underline">
              Configurações
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/trocar-senha" className="text-xs opacity-70 hover:opacity-100 hover:underline">
            Trocar Senha
          </Link>
          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            {user?.nome} · {user?.roles.map((r) => ROLE_LABEL[r] ?? r).join(', ')}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm bg-white font-medium px-3 py-1 rounded hover:opacity-90 transition"
            style={{ color: 'var(--color-primary)' }}
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
