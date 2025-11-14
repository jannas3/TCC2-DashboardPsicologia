'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';

import { MobileNav } from './mobile-nav';
import { UserPopover } from './user-popover';
import { useUser } from '@/hooks/use-user';
import { useSideNavState } from '@/hooks/use-sidenav';

const DEFAULT_AVATAR = '/assets/avatar.png';

type UIUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatar?: string | null;
};

// helper pra não duplicar ?t=...
function withCacheBuster(url?: string | null, seed?: number) {
  if (!url) return undefined;
  const hasQuery = url.includes('?');
  const param = `t=${seed ?? Date.now()}`;
  return `${url}${hasQuery ? '&' : '?'}${param}`;
}

export function MainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState(false);
  const [userMenuEl, setUserMenuEl] = React.useState<HTMLElement | null>(null);
  const { open: isSideNavOpen, toggle: toggleSideNav } = useSideNavState();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // tipagem local do hook
  const { user } = useUser() as { user: UIUser | null };

  // nome exibido e inicial seguros (sem indexing em tipo desconhecido)
  const displayName: string =
    [user?.firstName ?? '', user?.lastName ?? ''].join(' ').trim() ||
    (user?.email ? user.email.split('@')[0] : 'Usuário');

  const initial: string = displayName.length ? displayName.charAt(0).toUpperCase() : 'U';

  // cache-buster para quando o avatar mudar após upload
  const [avatarSeed, setAvatarSeed] = React.useState<number>(0);
  React.useEffect(() => {
    setAvatarSeed(Date.now());
  }, [user?.avatar]);

  const [avatarSrc, setAvatarSrc] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    const src = user?.avatar || DEFAULT_AVATAR;
    setAvatarSrc(withCacheBuster(src, avatarSeed));
  }, [user?.avatar, avatarSeed]);

  const handleAvatarError = () => setAvatarSrc(withCacheBuster(DEFAULT_AVATAR));

  const handleUserOpen = (event: React.MouseEvent<HTMLElement>) => setUserMenuEl(event.currentTarget);
  const handleUserClose = () => setUserMenuEl(null);

  React.useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key !== '/') return;
      event.preventDefault();
      if (isDesktop) {
        toggleSideNav();
      } else {
        setOpenNav(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [isDesktop, toggleSideNav]);

  const handleToggle = () => {
    toggleSideNav();
    if (!isDesktop) {
      setOpenNav(prev => !prev);
    }
  };

  const isExpanded = isDesktop ? isSideNavOpen : openNav;

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
        {/* Botão toggle sidebar */}
        <Tooltip title={`${isExpanded ? 'Recolher' : 'Expandir'} sidebar (Ctrl+/)`}>
          <span>
            <IconButton
              onClick={handleToggle}
              sx={{
                border: '2px solid',
                borderColor: 'primary.light',
                borderRadius: 2,
                width: 44,
                height: 36,
                '&:hover': { backgroundColor: 'action.hover' },
              }}
              aria-label={isExpanded ? 'Recolher menu lateral' : 'Abrir menu lateral'}
            >
              {isExpanded ? (
                <MenuOpenIcon sx={{ fontSize: 26 }} />
              ) : (
                <MenuIcon sx={{ fontSize: 26 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>

        {/* Busca pequena */}
        <Box
          sx={{
            flex: { xs: 1, sm: '0 0 auto' },
            width: { xs: 'auto', sm: 220 },
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
              alt={displayName}
              onError={handleAvatarError}
              sx={{
                width: 32,
                height: 32,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'divider',
              }}
            >
              {initial}
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
