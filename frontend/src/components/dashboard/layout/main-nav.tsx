'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import Tooltip from '@mui/material/Tooltip';

import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';

import { MobileNav } from './mobile-nav';
import { UserPopover } from './user-popover';

export function MainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState(false);
  const [userMenuEl, setUserMenuEl] = React.useState<HTMLElement | null>(null);
  const [avatarSrc, setAvatarSrc] = React.useState<string | undefined>('/assets/avatar.png');

  const handleUserOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuEl(event.currentTarget);
  };
  const handleUserClose = () => {
    setUserMenuEl(null);
  };

  return (
    <>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Botão 3 risquinhos */}
        <IconButton
          onClick={() => {
            if (typeof window !== 'undefined') {
              const isDesktop = window.matchMedia('(min-width: 1200px)').matches; // lg
              if (isDesktop) {
                window.dispatchEvent(new CustomEvent('psico-toggle-sidenav-hidden'));
              } else {
                setOpenNav(true); // no mobile abre o Drawer
              }
            }
          }}
          sx={{
            border: '2px solid',
            borderColor: 'primary.light',
            borderRadius: 2,
            width: 44,
            height: 36,
            '&:hover': { backgroundColor: 'action.hover' },
          }}
          aria-label="Abrir/fechar menu"
        >
          <ListIcon size={20} weight="bold" />
        </IconButton>

        {/* Busca pequena */}
        <Box
          sx={{
            flex: { xs: 1, sm: '0 0 auto' },
            width: { xs: 'auto', sm: 220 }, // 100% no mobile, 220px no desktop
            display: 'flex',
            alignItems: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            px: 1.5,
            height: 36,
          }}
        >
          <InputBase placeholder="Buscar..." sx={{ width: '100%' }} />
        </Box>

        {/* Ações à direita */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
          <Tooltip title="Notificações">
            <IconButton aria-label="Notificações">
              <BellIcon size={20} />
            </IconButton>
          </Tooltip>

          <IconButton onClick={handleUserOpen} aria-label="Abrir menu do usuário" sx={{ p: 0 }}>
            <Avatar
              src={avatarSrc}
              alt="Minha conta"
              onError={() => setAvatarSrc(undefined)} // fallback para letra se a imagem falhar
              sx={{
                width: 32,
                height: 32,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'divider',
              }}
            >
              U
            </Avatar>
          </IconButton>
        </Stack>
      </Box>

      {/* Drawer mobile */}
      <MobileNav open={openNav} onClose={() => setOpenNav(false)} />

      {/* Popover usuário */}
      <UserPopover anchorEl={userMenuEl} onClose={handleUserClose} open={Boolean(userMenuEl)} />
    </>
  );
}
