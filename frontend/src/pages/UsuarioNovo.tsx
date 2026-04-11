import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createUser } from '../api/users';
import type { UserCreatePayload } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import type { Role } from '../types';

const ALL_ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'medico', label: 'Médico' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'admin', label: 'Administrador' },
];

interface FormData {
  nome: string;
  email: string;
  password: string;
  cpf?: string;
  data_nascimento?: string;
  email_contato?: string;
}

export default function UsuarioNovo() {
  const navigate = useNavigate();
  const { isRole } = useAuth();
  const isAdmin = isRole('admin');
  const ROLE_OPTIONS = isAdmin ? ALL_ROLE_OPTIONS : ALL_ROLE_OPTIONS.filter((o) => o.value === 'medico');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['medico']);
  const [rolesError, setRolesError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const isMedico = selectedRoles.includes('medico');

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    setRolesError('');
  };

  const onSubmit = async (data: FormData) => {
    if (selectedRoles.length === 0) {
      setRolesError('Selecione ao menos um perfil.');
      return;
    }
    setLoading(true);
    setGeneralError('');
    setRolesError('');
    try {
      const payload: UserCreatePayload = {
        nome: data.nome,
        email: data.email,
        password: data.password,
        roles: selectedRoles,
        ...(isMedico
          ? { cpf: data.cpf || undefined }
          : {
              data_nascimento: data.data_nascimento || undefined,
              email_contato: data.email_contato || undefined,
            }),
      };
      await createUser(payload);
      navigate(isAdmin ? '/usuarios' : '/medicos');
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const errs = e?.response?.data;
      if (errs) {
        const FORM_FIELDS: (keyof FormData)[] = ['nome', 'email', 'password', 'cpf', 'data_nascimento', 'email_contato'];
        FORM_FIELDS.forEach((field) => {
          const val = errs[field];
          if (val) setError(field, { message: Array.isArray(val) ? val[0] : String(val) });
        });
        if (errs['roles']) setRolesError(Array.isArray(errs['roles']) ? errs['roles'][0] : String(errs['roles']));
        if (errs['detail']) setGeneralError(String(errs['detail']));
        if (errs['non_field_errors']) setGeneralError(Array.isArray(errs['non_field_errors']) ? errs['non_field_errors'][0] : String(errs['non_field_errors']));
      } else {
        setGeneralError('Ocorreu um erro inesperado. Tente novamente.');
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

          {generalError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
              {generalError}
            </div>
          )}

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
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de acesso</label>
              <input
                type="email"
                {...register('email', { required: 'Campo obrigatório.' })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Perfis</label>
              <div className="flex flex-wrap gap-3">
                {ROLE_OPTIONS.map(({ value, label }) => {
                  const locked = !isAdmin && value === 'medico';
                  return (
                    <label key={value} className={`flex items-center gap-2 ${locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(value)}
                        onChange={() => !locked && toggleRole(value)}
                        disabled={locked}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  );
                })}
              </div>
              {rolesError && <p className="text-red-600 text-xs mt-1">{rolesError}</p>}
            </div>

            {/* Campos do médico */}
            {isMedico && (
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

            {/* Campos do funcionário (não-médico) */}
            {!isMedico && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Identificação do funcionário</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    {...register('cpf', { required: 'Campo obrigatório.' })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.cpf && <p className="text-red-600 text-xs mt-1">{errors.cpf.message}</p>}
                </div>
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
                onClick={() => navigate(isAdmin ? '/usuarios' : '/medicos')}
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
