/** @type {import('next').NextConfig} */
const config = {
  // Melhora o tratamento de erros de chunk loading
  onDemandEntries: {
    // Período em ms que uma página fica em cache
    maxInactiveAge: 25 * 1000,
    // Número de páginas que devem ser mantidas simultaneamente
    pagesBufferLength: 2,
  },
  // Configurações de webpack para melhorar o carregamento de chunks
  webpack: (config, { isServer }) => {
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
    return config;
  },
  // Desabilita o cache de build em desenvolvimento para evitar problemas
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      // Força a reconstrução de chunks em desenvolvimento
      optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    },
  }),
};

export default config;
