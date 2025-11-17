/** @type {import('next').NextConfig} */
const config = {
  // Melhora o tratamento de erros de chunk loading
  onDemandEntries: {
    // Período em ms que uma página fica em cache
    maxInactiveAge: 25 * 1000,
    // Número de páginas que devem ser mantidas simultaneamente
    pagesBufferLength: 2,
  },
  // Gera um build ID estável em desenvolvimento para evitar chunks desatualizados
  // Usa um ID baseado em timestamp apenas quando necessário
  ...(process.env.NODE_ENV === 'development' && {
    generateBuildId: async () => {
      // Usa um ID estável baseado no dia para evitar rebuilds constantes
      const today = new Date();
      const dayId = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      return `dev-${dayId}`;
    },
  }),
  // Configurações de webpack para melhorar o carregamento de chunks
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Melhora o tratamento de erros de chunk loading no cliente
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    // Resolve problemas com caminhos de arquivos no Docker/Windows
    // Desabilita filesystem watching problemático
    config.watchOptions = {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/.turbo/**',
      ],
      // Usa polling no Docker para evitar problemas com filesystem
      poll: 1000,
      aggregateTimeout: 300,
    };
    
    // Usa cache em memória ao invés de filesystem para evitar problemas no Docker
    if (isServer) {
      config.cache = {
        type: 'memory',
        maxGenerations: 1,
      };
    }
    
    return config;
  },
  // Desabilita o cache de build em desenvolvimento para evitar problemas
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      // Força a reconstrução de chunks em desenvolvimento
      optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    },
  }),
  // Configurações para resolver problemas com filesystem no Docker
  ...(process.env.NODE_ENV === 'development' && {
    // Desabilita otimizações que podem causar problemas com caminhos
    swcMinify: false,
    // Desabilita turbopack que pode causar problemas com filesystem
    turbo: undefined,
  }),
};

export default config;
