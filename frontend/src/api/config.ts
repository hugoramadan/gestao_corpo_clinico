import api from './axios';

export interface Config {
  nome: string;
  subtitulo: string;
  cor_primaria: string;
  logo: string | null;
}

export const getConfig = (): Promise<Config> =>
  api.get<Config>('/config/').then((r) => r.data);

export const updateConfig = (data: FormData): Promise<Config> =>
  api.patch<Config>('/config/', data).then((r) => r.data);
