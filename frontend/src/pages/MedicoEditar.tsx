import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMedico, updateMedico } from '../api/medicos';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import MedicoForm from '../components/MedicoForm';
import type { Medico } from '../types';

export default function MedicoEditar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isRole } = useAuth();
  const [medico, setMedico] = useState<Medico | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getMedico(Number(id))
      .then(setMedico)
      .catch(() => navigate('/medicos'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (fd: FormData) => {
    if (!id) return;
    const updated = await updateMedico(Number(id), fd);
    setMedico(updated);
    navigate(`/medicos/${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Editar Cadastro: {medico?.nome_completo}
            </h2>
            <button
              onClick={() => navigate(`/medicos/${id}`)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← Voltar
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            medico && (
              <MedicoForm
                initial={medico}
                onSubmit={handleSubmit}
                isAdmin={isRole('gestor', 'admin')}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
