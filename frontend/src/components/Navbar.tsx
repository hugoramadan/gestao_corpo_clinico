import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const roleLabel: Record<string, string> = {
  medico: 'Médico',
  gestor: 'Gestor',
  admin: 'Administrador',
};

export default function Navbar() {
  const { user, logout, isRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="text-lg font-bold tracking-tight">
          Corpo Clínico
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
          {isRole('admin') && (
            <Link to="/usuarios" className="text-sm hover:underline">
              Usuários
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/trocar-senha" className="text-xs text-blue-200 hover:text-white hover:underline">
            Trocar Senha
          </Link>
          <span className="text-xs bg-blue-800 px-2 py-1 rounded">
            {user?.nome} · {roleLabel[user?.role ?? '']}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm bg-white text-blue-700 px-3 py-1 rounded hover:bg-blue-50 font-medium"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
