import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../api/users';
import Navbar from '../components/Navbar';

interface FormData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export default function TrocarSenha() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isForced = user?.must_change_password ?? false;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await changePassword(data);
      await refreshUser();
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const errs = e?.response?.data;
      if (errs) {
        (Object.keys(errs) as (keyof FormData)[]).forEach((field) => {
          setError(field, { message: errs[field as string]?.[0] ?? String(errs[field as string]) });
        });
        if (errs['detail'] || errs['non_field_errors']) {
          setError('current_password', {
            message: String(errs['detail'] ?? errs['non_field_errors']),
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {!isForced && <Navbar />}

      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          {isForced && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
              <strong>Senha provisória detectada.</strong> Crie uma senha pessoal para continuar acessando o sistema.
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-md p-8">
            <h1 className="text-xl font-bold text-slate-800 mb-6">Alterar Senha</h1>

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm">
                Senha alterada com sucesso! Redirecionando...
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Senha atual
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  {...register('current_password', { required: 'Informe a senha atual.' })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.current_password && (
                  <p className="text-red-600 text-xs mt-1">{errors.current_password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nova senha
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...register('new_password', {
                    required: 'Informe a nova senha.',
                    minLength: { value: 8, message: 'Mínimo de 8 caracteres.' },
                  })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.new_password && (
                  <p className="text-red-600 text-xs mt-1">{errors.new_password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmar nova senha
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...register('new_password_confirm', {
                    required: 'Confirme a nova senha.',
                    validate: (val) =>
                      val === watch('new_password') || 'As senhas não conferem.',
                  })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.new_password_confirm && (
                  <p className="text-red-600 text-xs mt-1">{errors.new_password_confirm.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm transition"
              >
                {loading ? 'Salvando...' : 'Alterar Senha'}
              </button>

              {!isForced && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-lg text-sm transition"
                >
                  Cancelar
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
