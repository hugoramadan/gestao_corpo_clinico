import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createUser } from '../api/users';
import Navbar from '../components/Navbar';

interface FormData {
  nome: string;
  email: string;
  role: 'medico' | 'gestor' | 'admin';
  password: string;
  cpf?: string;
}

export default function UsuarioNovo() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { role: 'medico' } });
  const [loading, setLoading] = useState(false);

  const role = watch('role');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = { ...data };
      if (role !== 'medico') delete payload.cpf;
      await createUser(payload);
      navigate('/usuarios');
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const errs = e?.response?.data;
      if (errs) {
        (Object.keys(errs) as (keyof FormData)[]).forEach((field) => {
          setError(field, { message: errs[field as string]?.[0] ?? String(errs[field as string]) });
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Novo Usuário</h1>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 mb-6">
            <span className="mt-0.5 shrink-0">&#9432;</span>
            <span>O usuário receberá uma <strong>senha provisória</strong> e será obrigado a criar uma senha pessoal no primeiro acesso.</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
              <input
                type="text"
                {...register('nome', { required: 'Campo obrigatório.' })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.nome && <p className="text-red-600 text-xs mt-1">{errors.nome.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                {...register('email', { required: 'Campo obrigatório.' })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Perfil</label>
              <select
                {...register('role', { required: true })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="medico">Médico</option>
                <option value="gestor">Gestor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {role === 'medico' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  CPF <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  {...register('cpf')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.cpf && <p className="text-red-600 text-xs mt-1">{errors.cpf.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha provisória</label>
              <input
                type="password"
                autoComplete="new-password"
                {...register('password', {
                  required: 'Campo obrigatório.',
                  minLength: { value: 8, message: 'Mínimo de 8 caracteres.' },
                })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm transition"
              >
                {loading ? 'Criando...' : 'Criar Usuário'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/usuarios')}
                className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-lg text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
