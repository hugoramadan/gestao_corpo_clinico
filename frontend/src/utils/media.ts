/**
 * Corrige URLs absolutas geradas pelo backend (hostname interno do container)
 * substituindo o origin pelo origin atual do browser.
 * Isso garante que os arquivos de mídia passem pelo proxy do Vite em dev
 * e pelo servidor correto em produção.
 */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return window.location.origin + parsed.pathname;
  } catch {
    return url; // já é relativa
  }
}
