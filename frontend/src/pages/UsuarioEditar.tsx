import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getUser, updateUser } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import type { User } from '../types';

interface FormData {
  nome: string;
  email: string;
  role: 'medico' | 'gestor' | 'admin';
  is_active: boolean;
}

interface PasswordFormData {
  new_password: string;
}

const ROLE_LABEL: Record<string, string> = {
  medico: 'Médico',
  gestor: 'Gestor',
  admin: 'Administrador',
};

export default function UsuarioEditar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const {
    register: registerPwd,
    handleSubmit: handleSubmitPwd,
    setError: setErrorPwd,
    reset: resetPwd,
    formState: { errors: errorsPwd },
  } = useForm<PasswordFormData>();

  const isSelf = me?.id === Number(id);

  useEffect(() => {
    getUser(Number(id))
      .then((u) => {
        setUserData(u);
        reset({
          nome: u.nome,
          email: u.email,
          role: u.role,
          is_active: u.is_active,
        });
      })
      .catch(() => navigate('/usuarios'))
      .finally(() => setLoading(false));
  }, [id, navigate, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await updateUser(Number(id), data);
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
      setSaving(false);
    }
  };

  const onResetPassword = async (data: PasswordFormData) => {
    setResettingPwd(true);
    setPwdSuccess(false);
    try {
      await updateUser(Number(id), { new_password: data.new_password });
      setPwdSuccess(true);
      resetPwd();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const errs = e?.response?.data;
      if (errs) {
        setErrorPwd('new_password', {
          message: errs['new_password']?.[0] ?? String(errs['non_field_errors'] ?? 'Erro ao redefinir senha.'),
        });
      }
    } finally {
      setResettingPwd(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/usuarios')} className="text-slate-500 hover:text-slate-700 text-sm">
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Editar Usuário</h1>
        </div>

        {isSelf && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
            Você está editando sua própria conta. Não é possível alterar seu perfil ou desativar-se.
          </div>
        )}

        {/* Dados do usuário */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Dados do Usuário</h2>

          <div className="text-xs text-slate-400 mb-4 space-y-1">
            <p>Criado em: {new Date(userData.date_joined).toLocaleDateString('pt-BR')}</p>
            <p>Senha provisória: {userData.must_change_password ? 'Sim (aguardando troca)' : 'Não'}</p>
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
                {...register('role')}
                disabled={isSelf}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {Object.entries(ROLE_LABEL).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              {errors.role && <p className="text-red-600 text-xs mt-1">{errors.role.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                disabled={isSelf}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <label htmlFor="is_active" className="text-sm text-slate-700">Usuário ativo</label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm transition"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* Reset de senha */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-base font-semibold text-slate-700 mb-1">Redefinir Senha Provisória</h2>
          <p className="text-xs text-slate-500 mb-4">
            Defina uma nova senha provisória. O usuário será obrigado a trocá-la no próximo acesso.
          </p>

          {pwdSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm">
              Senha provisória definida com sucesso.
            </div>
          )}

          <form onSubmit={handleSubmitPwd(onResetPassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha provisória</label>
              <input
                type="password"
                autoComplete="new-password"
                {...registerPwd('new_password', {
                  required: 'Campo obrigatório.',
                  minLength: { value: 8, message: 'Mínimo de 8 caracteres.' },
                })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errorsPwd.new_password && (
                <p className="text-red-600 text-xs mt-1">{errorsPwd.new_password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={resettingPwd}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm transition"
            >
              {resettingPwd ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
