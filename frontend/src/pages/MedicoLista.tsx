import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMedicos } from '../api/medicos';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import type { MedicoListItem } from '../types';

const STATUS_COLORS = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-red-100 text-red-600',
  pendente: 'bg-yellow-100 text-yellow-700',
};

export default function MedicoLista() {
  const { isRole } = useAuth();
  const [medicos, setMedicos] = useState<MedicoListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    getMedicos(debouncedSearch)
      .then(setMedicos)
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Médicos Cadastrados</h2>
          {isRole('admin') && (
            <Link
              to="/medicos/novo"
              className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Novo Médico
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <input
            type="text"
            placeholder="Buscar por nome, CPF, CRM ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : medicos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-400 text-sm">Nenhum médico encontrado.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">CRM</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Especialidades</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">E-mail</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {medicos.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.foto_perfil ? (
                          <img src={m.foto_perfil} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-400 text-xs">👤</div>
                        )}
                        <span className="font-medium text-slate-800">{m.nome_completo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {m.crm_numero}/{m.crm_estado}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {m.especialidades.slice(0, 2).map((e) => (
                          <span key={e.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {e.nome}
                          </span>
                        ))}
                        {m.especialidades.length > 2 && (
                          <span className="text-xs text-slate-400">+{m.especialidades.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{m.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[m.status]}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/medicos/${m.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100">
              {medicos.length} médico{medicos.length !== 1 ? 's' : ''} encontrado{medicos.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
