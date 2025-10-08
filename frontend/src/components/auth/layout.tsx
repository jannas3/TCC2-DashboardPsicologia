import * as React from 'react';
import RouterLink from 'next/link';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';

import { paths } from '@/paths';

export interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, md: 4 },
        // fundo suave como no mock
        background:
          'radial-gradient(1200px 600px at 10% -10%, rgba(130,156,255,0.08), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(168,255,236,0.10), transparent 60%), linear-gradient(180deg, #f7f9ff 0%, #f3f6fb 100%)'
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 560,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 8px 30px rgba(43, 55, 83, 0.08)'
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          {/* topo com logo e título */}
          <Stack spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box
              component={RouterLink}
              href={paths.home}
              sx={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
            >
              {/* SUA LOGO AQUI */}
              <Image
                src="/logo-ifam.png"
                alt="PsicoFlow"
                width={64}
                height={64}
                style={{
                  borderRadius: 16,
                  boxShadow: '0 6px 18px rgba(76, 78, 237, 0.18)'
                }}
                priority
              />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              PsicoFlow
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Plataforma de Gestão Psicológica
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Bem-vindo de volta! Acesse sua área profissional
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* formulário (SignInForm) */}
          {children}

          {/* rodapé de ajuda */}
          <Divider sx={{ mt: 3 }} />
          <Stack alignItems="center" sx={{ mt: 2 }} spacing={1}>
            <Typography variant="caption" color="text.secondary">
              SUPORTE TÉCNICO
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Problemas de acesso? Entre em contato com nosso suporte
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
