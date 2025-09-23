import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import GlobalStyles from '@mui/material/GlobalStyles';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MainNav } from '@/components/dashboard/layout/main-nav';
import { SideNav } from '@/components/dashboard/layout/side-nav';

interface LayoutProps {
  children: React.ReactNode;
}
export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <AuthGuard>
      <GlobalStyles
        styles={{
          body: {
            '--MainNav-height': '56px',
            '--MainNav-zIndex': 1000,
            '--SideNav-width': '260px', // alinhe com o SideNav
            '--SideNav-zIndex': 1100,
            '--MobileNav-width': '320px',
            '--MobileNav-zIndex': 1100,
          },
        }}
      />

      <Box
        sx={{
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          pl: { lg: 'var(--SideNav-width-current, var(--SideNav-width))' },
          transition: 'padding-left .2s ease',
        }}
      >
        <SideNav />

        {/* REMOVA o pl fixo aqui */}
        <Box sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column' }}>
          <MainNav />
          <main>
            <Container maxWidth="xl" sx={{ py: '64px' }}>
              {children}
            </Container>
          </main>
        </Box>
      </Box>
    </AuthGuard>
  );
}
