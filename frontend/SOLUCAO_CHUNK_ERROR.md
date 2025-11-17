# Solução para Erro de Chunk Loading

## Problema
Erro `ChunkLoadError` ao carregar chunks do Next.js, especialmente `app/layout.js`.

## Soluções Aplicadas

### 1. Melhorias no ChunkErrorHandler
- ✅ Adicionado controle de tentativas de reload (máximo 2)
- ✅ Adicionado cooldown de 5 segundos entre reloads
- ✅ Limpeza automática de cache quando necessário
- ✅ Prevenção de loops infinitos

### 2. Build ID Estável
- ✅ Alterado para usar ID baseado no dia ao invés de timestamp
- ✅ Evita rebuilds constantes que causam chunks desatualizados

## Soluções Manuais (se o erro persistir)

### Opção 1: Limpar Cache do Next.js
```bash
cd TCC2-DashboardPsicologia/frontend
rm -rf .next
npm run dev
```

### Opção 2: Limpar Cache do Navegador
1. Abra as DevTools (F12)
2. Clique com botão direito no botão de reload
3. Selecione "Limpar cache e recarregar forçado"

### Opção 3: Reinstalar Dependências
```bash
cd TCC2-DashboardPsicologia/frontend
rm -rf node_modules .next
npm install
npm run dev
```

### Opção 4: Usar Modo de Produção Temporariamente
```bash
cd TCC2-DashboardPsicologia/frontend
npm run build
npm start
```

### Opção 5: Desabilitar Cache do Next.js (temporário)
Adicione ao `next.config.mjs`:
```javascript
experimental: {
  isrMemoryCacheSize: 0, // Desabilita cache ISR
}
```

## Verificações

1. ✅ ChunkErrorHandler melhorado com controle de loops
2. ✅ Build ID mais estável
3. ✅ Configurações de webpack otimizadas
4. ✅ Tratamento de erros melhorado

## Se o Problema Persistir

1. Verifique se há erros no console do servidor
2. Verifique se o servidor está rodando na porta correta (3001)
3. Verifique se há conflitos de porta
4. Tente usar uma porta diferente:
   ```bash
   PORT=3002 npm run dev
   ```


