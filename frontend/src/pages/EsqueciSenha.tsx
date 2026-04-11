import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/password-reset/', { email });
      setEnviado(true);
    } catch {
      setError('Erro ao processar a solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-1">Corpo Clínico</h1>
        <p className="text-center text-slate-500 text-sm mb-6">Recuperação de senha</p>

        {enviado ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-sm">
              <p className="font-medium mb-1">Instruções enviadas!</p>
              <p>
                Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link
                para redefinir sua senha em instantes.
              </p>
            </div>
            <p className="text-xs text-slate-400">
              Não recebeu? Verifique a pasta de spam ou tente novamente.
            </p>
            <Link to="/login" className="block text-blue-600 hover:underline text-sm font-medium">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <p className="text-sm text-slate-600">
              Informe seu e-mail cadastrado. Enviaremos um link para redefinir sua senha.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
                placeholder="seu@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar instruções'}
            </button>
            <p className="text-center text-sm text-slate-500">
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
