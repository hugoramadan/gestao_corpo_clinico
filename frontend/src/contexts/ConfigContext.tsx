import { createContext, useContext, useEffect, useState } from 'react';
import { getConfig } from '../api/config';
import { mediaUrl } from '../utils/media';

interface ConfigContextValue {
  nome: string;
  subtitulo: string;
  corPrimaria: string;
  logoUrl: string | null;
  reload: () => void;
}

const defaults: ConfigContextValue = {
  nome: 'Corpo Clínico',
  subtitulo: 'Gestão de Profissionais de Saúde',
  corPrimaria: '#1d4ed8',
  logoUrl: null,
  reload: () => {},
};

const ConfigContext = createContext<ConfigContextValue>(defaults);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [nome, setNome] = useState(defaults.nome);
  const [subtitulo, setSubtitulo] = useState(defaults.subtitulo);
  const [corPrimaria, setCorPrimaria] = useState(defaults.corPrimaria);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const apply = (cor: string) => {
    document.documentElement.style.setProperty('--color-primary', cor);
  };

  const load = () => {
    getConfig()
      .then((cfg) => {
        setNome(cfg.nome);
        setSubtitulo(cfg.subtitulo);
        setCorPrimaria(cfg.cor_primaria);
        setLogoUrl(cfg.logo ? mediaUrl(cfg.logo) : null);
        apply(cfg.cor_primaria);
      })
      .catch(() => {
        // Mantém defaults se API falhar (ex: offline)
        apply(defaults.corPrimaria);
      });
  };

  useEffect(() => {
    apply(defaults.corPrimaria);
    load();
  }, []);

  return (
    <ConfigContext.Provider value={{ nome, subtitulo, corPrimaria, logoUrl, reload: load }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
