import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const { user, isRole } = useAuth();
  const { nome } = useConfig();

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Olá, {user?.nome}!
        </h2>
        <p className="text-slate-500 mb-8">Bem-vindo ao {nome}.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isRole('medico') && (
            <Link
              to="/perfil"
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition border border-slate-200"
            >
              <div className="text-3xl mb-3">👤</div>
              <h3 className="font-semibold text-slate-800 mb-1">Meu Cadastro</h3>
              <p className="text-sm text-slate-500">Visualize e atualize seus dados cadastrais.</p>
            </Link>
          )}

          {isRole('gestor', 'admin') && (
            <Link
              to="/medicos"
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition border border-slate-200"
            >
              <div className="text-3xl mb-3">🏥</div>
              <h3 className="font-semibold text-slate-800 mb-1">Médicos Cadastrados</h3>
              <p className="text-sm text-slate-500">Gerencie o cadastro de todos os médicos.</p>
            </Link>
          )}

          {isRole('admin') && (
            <Link
              to="/usuarios"
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition border border-slate-200"
            >
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-semibold text-slate-800 mb-1">Usuários do Sistema</h3>
              <p className="text-sm text-slate-500">Gerencie contas de administradores, gestores e médicos.</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
