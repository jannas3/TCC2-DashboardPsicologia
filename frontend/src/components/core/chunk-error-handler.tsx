'use client';

import * as React from 'react';

/**
 * Handler global para erros de carregamento de chunks do Next.js
 * Recarrega a página automaticamente quando detecta ChunkLoadError
 * Evita loops infinitos usando sessionStorage
 */
export function ChunkErrorHandler({ children }: { children: React.ReactNode }): React.JSX.Element {
  React.useEffect(() => {
    // Previne loops infinitos de reload
    const RELOAD_KEY = 'chunk-error-reload-attempt';
    const MAX_RELOADS = 2;
    const RELOAD_COOLDOWN = 5000; // 5 segundos

    const getReloadCount = (): number => {
      try {
        const data = sessionStorage.getItem(RELOAD_KEY);
        if (!data) return 0;
        const parsed = JSON.parse(data);
        const now = Date.now();
        // Se passou o cooldown, reseta o contador
        if (now - parsed.timestamp > RELOAD_COOLDOWN) {
          sessionStorage.removeItem(RELOAD_KEY);
          return 0;
        }
        return parsed.count || 0;
      } catch {
        return 0;
      }
    };

    const incrementReloadCount = (): void => {
      try {
        const count = getReloadCount();
        sessionStorage.setItem(
          RELOAD_KEY,
          JSON.stringify({ count: count + 1, timestamp: Date.now() })
        );
      } catch {
        // Ignora erros de sessionStorage
      }
    };

    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message || '';
      const errorString = String(error);
      
      // Detecta erros de chunk loading
      if (
        errorString.includes('ChunkLoadError') ||
        errorString.includes('Loading chunk') ||
        errorString.includes('Failed to fetch dynamically imported module') ||
        errorString.includes('error loading chunk')
      ) {
        const reloadCount = getReloadCount();
        
        if (reloadCount >= MAX_RELOADS) {
          console.error('[ChunkErrorHandler] Muitas tentativas de reload. Limpando cache e recarregando...');
          // Limpa o cache e força reload completo
          sessionStorage.clear();
          // Tenta limpar o cache do navegador
          if ('caches' in window) {
            caches.keys().then((names) => {
              names.forEach((name) => {
                caches.delete(name);
              });
            });
          }
          window.location.href = window.location.href.split('?')[0];
          return;
        }

        console.warn(`[ChunkErrorHandler] ChunkLoadError detectado (tentativa ${reloadCount + 1}/${MAX_RELOADS}), recarregando página...`);
        incrementReloadCount();
        
        // Recarrega a página após um pequeno delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const reasonString = String(reason || '');
      
      // Detecta rejeições de promise relacionadas a chunks
      if (
        reasonString.includes('ChunkLoadError') ||
        reasonString.includes('Loading chunk') ||
        reasonString.includes('Failed to fetch dynamically imported module')
      ) {
        const reloadCount = getReloadCount();
        
        if (reloadCount >= MAX_RELOADS) {
          console.error('[ChunkErrorHandler] Muitas tentativas de reload. Limpando cache...');
          sessionStorage.clear();
          if ('caches' in window) {
            caches.keys().then((names) => {
              names.forEach((name) => {
                caches.delete(name);
              });
            });
          }
          window.location.href = window.location.href.split('?')[0];
          return;
        }

        console.warn(`[ChunkErrorHandler] ChunkLoadError em Promise rejeitada (tentativa ${reloadCount + 1}/${MAX_RELOADS}), recarregando página...`);
        incrementReloadCount();
        
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}


