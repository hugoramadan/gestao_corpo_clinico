import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const senhaRedefinida = searchParams.get('senha') === 'redefinida';
  const registroOk = searchParams.get('registro') === 'ok';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.must_change_password) {
        navigate('/trocar-senha');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-2">Corpo Clínico</h1>
        <p className="text-center text-slate-500 text-sm mb-6">Gestão de Profissionais de Saúde</p>

        {senhaRedefinida && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            Senha redefinida com sucesso! Faça login com a nova senha.
          </div>
        )}
        {registroOk && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">
            Conta criada! Faça login para acessar o sistema.
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm text-slate-500">
          <p>
            <Link to="/esqueci-senha" className="text-blue-600 hover:underline font-medium">
              Esqueci minha senha
            </Link>
          </p>
          <p>
            Ainda não tenho cadastro.{' '}
            <Link to="/cadastro" className="text-blue-600 hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
