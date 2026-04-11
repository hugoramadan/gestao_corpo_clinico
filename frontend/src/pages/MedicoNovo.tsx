import { useNavigate } from 'react-router-dom';
import { createMedico } from '../api/medicos';
import Navbar from '../components/Navbar';
import MedicoForm from '../components/MedicoForm';

export default function MedicoNovo() {
  const navigate = useNavigate();

  const handleSubmit = async (fd: FormData) => {
    const created = await createMedico(fd);
    navigate(`/medicos/${created.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Novo Médico</h2>
            <button
              onClick={() => navigate('/medicos')}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← Voltar
            </button>
          </div>
          <MedicoForm onSubmit={handleSubmit} isAdmin />
        </div>
      </div>
    </div>
  );
}
