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

const CACHE_KEY = 'config_cache';

interface CachedConfig {
  nome: string;
  subtitulo: string;
  corPrimaria: string;
  logoUrl: string | null;
}

// Última configuração recebida da API, para aplicar a personalização já no
// primeiro render, sem esperar a requisição.
function readCache(): CachedConfig | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedConfig) : null;
  } catch {
    return null;
  }
}

function writeCache(cfg: CachedConfig) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cfg));
  } catch {
    // localStorage indisponível (ex: modo privado) — ignora
  }
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState(() => readCache());
  const [nome, setNome] = useState(initial?.nome ?? defaults.nome);
  const [subtitulo, setSubtitulo] = useState(initial?.subtitulo ?? defaults.subtitulo);
  const [corPrimaria, setCorPrimaria] = useState(initial?.corPrimaria ?? defaults.corPrimaria);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial?.logoUrl ?? null);

  const apply = (cor: string) => {
    document.documentElement.style.setProperty('--color-primary', cor);
  };

  const load = () => {
    getConfig()
      .then((cfg) => {
        const logo = cfg.logo ? mediaUrl(cfg.logo) : null;
        setNome(cfg.nome);
        setSubtitulo(cfg.subtitulo);
        setCorPrimaria(cfg.cor_primaria);
        setLogoUrl(logo);
        apply(cfg.cor_primaria);
        writeCache({ nome: cfg.nome, subtitulo: cfg.subtitulo, corPrimaria: cfg.cor_primaria, logoUrl: logo });
      })
      .catch(() => {
        // Mantém o que já está aplicado (cache ou defaults) se a API falhar (ex: offline)
      });
  };

  useEffect(() => {
    apply(initial?.corPrimaria ?? defaults.corPrimaria);
    load();
  }, []);

  return (
    <ConfigContext.Provider value={{ nome, subtitulo, corPrimaria, logoUrl, reload: load }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig deve ser usado dentro de <ConfigProvider>');
  return ctx;
};
