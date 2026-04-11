import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, deleteUser } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import type { User } from '../types';

const ROLE_LABEL: Record<string, string> = {
  medico: 'Médico',
  gestor: 'Gestor',
  admin: 'Administrador',
};

const ROLE_COLOR: Record<string, string> = {
  medico: 'bg-blue-100 text-blue-700',
  gestor: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
};

export default function UsuarioLista() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers(search || undefined);
      setUsers(data);
    } catch {
      setError('Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleDelete = async (u: User) => {
    if (u.id === me?.id) return; // nunca exclui a si mesmo
    if (!confirm(`Excluir usuário "${u.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch {
      alert('Não foi possível excluir o usuário.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Usuários do Sistema</h1>
          <Link
            to="/usuarios/novo"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Novo Usuário
          </Link>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou perfil..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-slate-500 py-12 text-sm">Nenhum usuário encontrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">E-mail</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Perfil</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Senha provisória</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {u.nome}
                      {u.id === me?.id && (
                        <span className="ml-2 text-xs text-slate-400">(você)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[u.role] ?? ''}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="text-green-700 font-medium">Ativo</span>
                      ) : (
                        <span className="text-slate-400">Inativo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.must_change_password ? (
                        <span className="text-amber-600 font-medium">Sim</span>
                      ) : (
                        <span className="text-slate-400">Não</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <Link
                        to={`/usuarios/${u.id}/editar`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        Editar
                      </Link>
                      {u.id !== me?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="text-red-600 hover:underline text-xs font-medium"
                        >
                          Excluir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
