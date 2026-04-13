import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, deleteUser } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import type { Role, User } from '../types';
import { ROLE_LABEL } from '../utils/roles';

const ROLE_COLOR: Record<string, string> = {
  medico: 'bg-blue-100 text-blue-700',
  gestor: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo', color: 'bg-green-100 text-green-700' },
  { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'inativo', label: 'Inativo', color: 'bg-red-100 text-red-600' },
];

function RoleBadges({ roles }: { roles: Role[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {(roles || []).map((r) => (
        <span key={r} className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[r] ?? 'bg-slate-100 text-slate-600'}`}>
          {ROLE_LABEL[r] ?? r}
        </span>
      ))}
    </div>
  );
}


export default function UsuarioLista() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['ativo', 'pendente']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers(debouncedSearch || undefined, selectedStatus);
      setUsers(data);
    } catch {
      setError('Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = (s: string) => {
    setSelectedStatus((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const canDelete = (u: User) => {
    if (u.id === me?.id) return false;
    return u.status === 'inativo';
  };

  const handleDelete = async (u: User) => {
    if (!canDelete(u)) return;
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

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            {STATUS_OPTIONS.map(({ value, label, color }) => (
              <label key={value} className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={selectedStatus.includes(value)}
                  onChange={() => toggleStatus(value)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
                  {label}
                </span>
              </label>
            ))}
          </div>
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
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Senha prov.</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const st = u.status;
                  const deletable = canDelete(u);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {u.nome}
                        {u.id === me?.id && (
                          <span className="ml-2 text-xs text-slate-400">(você)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadges roles={u.roles} />
                      </td>
                      <td className="px-4 py-3">
                        {st === 'ativo' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Ativo</span>}
                        {st === 'pendente' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Pendente</span>}
                        {st === 'inativo' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inativo</span>}
                        {!st && <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {u.must_change_password
                          ? <span className="text-amber-600 font-medium text-xs">Sim</span>
                          : <span className="text-slate-400 text-xs">Não</span>}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <Link
                          to={`/usuarios/${u.id}/editar`}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          Editar
                        </Link>
                        {deletable && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="text-red-600 hover:underline text-xs font-medium"
                          >
                            Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
