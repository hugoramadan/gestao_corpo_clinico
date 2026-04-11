import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get('uid') ?? '';
  const token = searchParams.get('token') ?? '';

  const [form, setForm] = useState({ new_password: '', new_password_confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.new_password !== form.new_password_confirm) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm/', { uid, token, ...form });
      navigate('/login?senha=redefinida');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.values(data)
          .flatMap((v) => (Array.isArray(v) ? v : [v]))
          .join(' ');
        setError(msgs || 'Erro ao redefinir senha.');
      } else {
        setError('Link inválido ou expirado. Solicite um novo link.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

  if (!uid || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md text-center space-y-4">
          <p className="text-red-600 font-medium">Link inválido ou expirado.</p>
          <Link to="/esqueci-senha" className="text-blue-600 hover:underline text-sm">
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-1">Corpo Clínico</h1>
        <p className="text-center text-slate-500 text-sm mb-6">Redefinir senha</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha *</label>
            <input
              name="new_password"
              type="password"
              value={form.new_password}
              onChange={set}
              required
              minLength={8}
              className={inputCls}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nova senha *</label>
            <input
              name="new_password_confirm"
              type="password"
              value={form.new_password_confirm}
              onChange={set}
              required
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
