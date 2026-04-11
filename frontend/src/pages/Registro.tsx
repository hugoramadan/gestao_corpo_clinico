import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

type Step = 'acesso' | 'dados';

export default function Registro() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('acesso');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Dados de acesso
    email: '',
    nome: '',
    password: '',
    password_confirm: '',
    // Dados básicos do cadastro médico
    cpf: '',
  });

  const set = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleAcesso = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password_confirm) {
      setError('As senhas não conferem.');
      return;
    }
    setStep('dados');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register/', form);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> }; message?: string };
      const data = axiosErr?.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.values(data)
          .flatMap((v) => (Array.isArray(v) ? v : [v]))
          .join(' ');
        setError(msgs || 'Erro ao criar conta. Verifique os dados e tente novamente.');
      } else if (!axiosErr?.response) {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
      setStep('acesso');
      setLoading(false);
      return;
    }

    // Registro OK — faz login automático
    try {
      await login(form.email, form.password);
      navigate('/perfil');
    } catch {
      // Conta criada mas login falhou — redireciona para login manual
      navigate('/login?registro=ok');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-8 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        {/* Header */}
        <h1 className="text-2xl font-bold text-center mb-1" style={{ color: 'var(--color-primary)' }}>Corpo Clínico</h1>
        <p className="text-center text-slate-500 text-sm mb-6">Criar conta de acesso — Médico</p>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1.5 rounded-full ${step === 'acesso' ? 'bg-blue-600' : 'bg-blue-600'}`} />
          <div className={`flex-1 h-1.5 rounded-full ${step === 'dados' ? 'bg-blue-600' : 'bg-slate-200'}`} />
        </div>
        <p className="text-xs text-slate-400 text-center mb-6">
          {step === 'acesso' ? 'Passo 1 de 2 — Dados de acesso' : 'Passo 2 de 2 — Identificação'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* === STEP 1: dados de acesso === */}
        {step === 'acesso' && (
          <form onSubmit={handleAcesso} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo *</label>
              <input name="nome" type="text" value={form.nome} onChange={set} required className={inputCls} placeholder="Dr. Maria Silva" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail *</label>
              <input name="email" type="email" value={form.email} onChange={set} required className={inputCls} placeholder="seu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha *</label>
              <input name="password" type="password" value={form.password} onChange={set} required minLength={8} className={inputCls} placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar senha *</label>
              <input name="password_confirm" type="password" value={form.password_confirm} onChange={set} required className={inputCls} />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
              Próximo →
            </button>
          </form>
        )}

        {/* === STEP 2: CPF === */}
        {step === 'dados' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
              <p className="font-medium mb-1">Você pode completar o cadastro agora ou depois</p>
              <p className="text-xs text-blue-600">
                O CPF é necessário para criar seu perfil. Os demais dados poderão ser preenchidos após o primeiro acesso — mas o cadastro só ficará <strong>ativo</strong> quando todos os campos forem preenchidos.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CPF *</label>
              <input
                name="cpf"
                type="text"
                value={form.cpf}
                onChange={set}
                required
                className={inputCls}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('acesso')}
                className="flex-1 border border-slate-300 text-slate-600 font-semibold py-2 rounded-lg hover:bg-slate-50 transition text-sm"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60 text-sm"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
