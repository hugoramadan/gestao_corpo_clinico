import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { useConfig } from '../contexts/ConfigContext';
import { updateConfig } from '../api/config';

export default function Configuracoes() {
  const { nome, subtitulo, corPrimaria, logoUrl, reload } = useConfig();

  const [formNome, setFormNome] = useState(nome);
  const [formSubtitulo, setFormSubtitulo] = useState(subtitulo);
  const [formCor, setFormCor] = useState(corPrimaria);
  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Sincroniza quando o contexto carrega
  useEffect(() => {
    setFormNome(nome);
    setFormSubtitulo(subtitulo);
    setFormCor(corPrimaria);
    setLogoPreview(logoUrl);
    setRemoveLogo(false);
  }, [nome, subtitulo, corPrimaria, logoUrl]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setRemoveLogo(false);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');
    try {
      const fd = new FormData();
      fd.append('nome', formNome);
      fd.append('subtitulo', formSubtitulo);
      fd.append('cor_primaria', formCor);
      if (logoFile) fd.append('logo', logoFile);
      if (removeLogo) fd.append('remover_logo', '1');
      await updateConfig(fd);
      reload();
      setSuccess(true);
    } catch {
      setError('Não foi possível salvar as configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Configurações do Sistema</h1>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-6">
              Configurações salvas com sucesso.
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome do sistema</label>
              <input
                type="text"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo</label>
              <input
                type="text"
                value={formSubtitulo}
                onChange={(e) => setFormSubtitulo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cor primária</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formCor}
                  onChange={(e) => setFormCor(e.target.value)}
                  className="w-12 h-10 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="text-sm text-slate-500 font-mono">{formCor}</span>
                <span className="text-xs text-slate-400">(navbar, botões principais)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Logo / Logomarca</label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-12 w-auto object-contain rounded border border-slate-200 p-1 bg-white" />
                ) : (
                  <div className="h-12 w-24 rounded border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                    Sem logo
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-sm border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition text-slate-700"
                >
                  {logoPreview ? 'Trocar imagem' : 'Enviar imagem'}
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    Remover logo
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">PNG ou SVG recomendado. Fundo transparente ideal.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-medium py-2 px-4 rounded-lg text-sm transition disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {loading ? 'Salvando...' : 'Salvar configurações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
