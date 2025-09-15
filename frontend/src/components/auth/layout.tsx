import * as React from 'react';
import RouterLink from 'next/link';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

import { paths } from '@/paths';
import { DynamicLogo } from '@/components/core/logo';

export interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout de autenticação estilo “IFAM Mente”
 * - Coluna esquerda: hero com imagem, título, subtítulo e KPIs em efeito glass
 * - Coluna direita: card com o formulário (children)
 */
export function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <Box
      sx={{
        display: { xs: 'flex', lg: 'grid' },
        flexDirection: 'column',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '100dvh',
        bgcolor: 'background.default',
      }}
    >
      {/* === Coluna Esquerda (Hero) === */}
      <Box
        sx={{
          position: 'relative',
          display: { xs: 'none', lg: 'block' },
          overflow: 'hidden',
          // imagem de fundo (troque o src conforme seu projeto)
          backgroundImage: 'url(/assets/mental-matters.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay verde/azulado suave */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(60% 60% at 30% 20%, rgba(12,68,64,0.55) 0%, rgba(9,14,35,0.75) 100%)',
          }}
        />

        {/* Conteúdo do hero */}
        <Box
          sx={{
            position: 'relative',
            height: '100%',
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {/* Bloco de marca (chip + título) */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 2,
              width: 'fit-content',
              bgcolor: 'rgba(0,0,0,0.25)',
              color: 'common.white',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label="IF"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: 'common.white',
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1, color: 'common.white' }}>
                  IFAM Mente
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Centro de Apoio Psicológico
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Título principal + subtítulo */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 2,
              maxWidth: 720,
              bgcolor: 'rgba(0,0,0,0.25)',
              color: 'common.white',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Stack spacing={1}>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Cuidando da Nossa Comunidade
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Plataforma integrada para apoio psicológico no IFAM
              </Typography>
            </Stack>
          </Paper>

          {/* KPIs “glass” */}
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              maxWidth: 760,
            }}
          >
            <GlassKpi title="Atendimentos" value="1.8k+" caption="Realizados" />
            <GlassKpi title="Campus" value="8" caption="Atendidos" />
          </Box>

          {/* Rodapé do hero (opcional) */}
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            © {new Date().getFullYear()} IFAM Mente • Centro de Apoio Psicológico do Instituto Federal do Amazonas
          </Typography>
        </Box>
      </Box>

      {/* === Coluna Direita (Card de Login) === */}
      <Box
        sx={{
          display: 'flex',
          flex: '1 1 auto',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, md: 4 },
          // fundo clarinho com leve gradiente para lembrar o mock
          background:
            'linear-gradient(180deg, rgba(236,248,246,0.5) 0%, rgba(245,249,250,0.9) 100%)',
        }}
      >
        <Card
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 520,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* logo/brand topo */}
            <Box sx={{ mb: 3 }}>
              <Box
                component={RouterLink}
                href={paths.home}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}
              >
                <DynamicLogo colorDark="dark" colorLight="dark" height={32} width={32} />
                <Box>
                  <Typography variant="h6">IFAM Mente</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Portal do psicólogo • Centro de Apoio Psicológico
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* aqui entra o seu formulário de autenticação */}
            {children}

            {/* links de ajuda (como no mock) */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="center"
              sx={{ mt: 3 }}
            >
              <Typography variant="body2" color="text.secondary">
                Precisa de ajuda?
              </Typography>
              <Stack direction="row" spacing={2}>
                <Typography component={RouterLink} href="#" variant="body2" color="primary" sx={{ textDecoration: 'none' }}>
                  TI IFAM
                </Typography>
                <Typography component={RouterLink} href="#" variant="body2" color="primary" sx={{ textDecoration: 'none' }}>
                  Coordenação
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

/** KPI em vidro (glassmorphism) */
function GlassKpi(props: { title: string; value: string; caption?: string }) {
  const { title, value, caption } = props;
  return (
    <Paper
      elevation={0}
      sx={{
        flex: '1 1 260px',
        minWidth: 260,
        borderRadius: 3,
        px: 3,
        py: 2,
        bgcolor: 'rgba(255,255,255,0.12)',
        color: 'common.white',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <Stack>
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          {title}
        </Typography>
        {caption && (
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            {caption}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
