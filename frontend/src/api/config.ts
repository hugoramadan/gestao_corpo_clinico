import axios from 'axios';
import api from './axios';

export interface Config {
  nome: string;
  subtitulo: string;
  cor_primaria: string;
  logo: string | null;
}

// Endpoint público: usa axios puro (sem o interceptor JWT) para que um token
// expirado no localStorage não cause 401/refresh/redirect antes de aplicar o tema.
export const getConfig = (): Promise<Config> =>
  axios.get<Config>('/api/config/').then((r) => r.data);

export const updateConfig = (data: FormData): Promise<Config> =>
  api.patch<Config>('/config/', data).then((r) => r.data);
