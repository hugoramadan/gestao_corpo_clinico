import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeuCadastro, updateMedico, createMedico } from '../api/medicos';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import MedicoForm from '../components/MedicoForm';
import CadastroIncompletoAviso from '../components/CadastroIncompletoAviso';
import type { Medico } from '../types';

export default function Perfil() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medico, setMedico] = useState<Medico | null>(null);
  const [loading, setLoading] = useState(true);
  const [noCadastro, setNoCadastro] = useState(false);

  useEffect(() => {
    getMeuCadastro()
      .then(setMedico)
      .catch((err) => {
        if (err?.response?.status === 404) setNoCadastro(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (fd: FormData) => {
    if (medico) {
      await updateMedico(medico.id, fd);
    } else {
      await createMedico(fd);
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">

        {/* Aviso de cadastro incompleto */}
        {medico && !medico.cadastro_completo && (
          <CadastroIncompletoAviso camposPendentes={medico.campos_pendentes} />
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-6">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-800">Meu Cadastro Médico</h2>
              <p className="text-sm text-slate-500 break-all">{user?.email}</p>
            </div>
            {medico && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${
                medico.status === 'ativo' ? 'bg-green-100 text-green-700' :
                medico.status === 'inativo' ? 'bg-red-100 text-red-600' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {medico.status.charAt(0).toUpperCase() + medico.status.slice(1)}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              {noCadastro && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  Você ainda não possui cadastro médico. Preencha os dados abaixo.
                </div>
              )}
              <MedicoForm initial={medico ?? undefined} onSubmit={handleSubmit} onCancel={() => navigate('/dashboard')} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
