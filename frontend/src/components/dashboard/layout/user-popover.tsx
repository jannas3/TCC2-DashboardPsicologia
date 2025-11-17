'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';

import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';

type UIUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatar?: string | null;
};

const DEFAULT_AVATAR = '';
const withCacheBuster = (url?: string | null, seed?: number) =>
  url ? `${url}${url.includes('?') ? '&' : '?'}t=${seed ?? Date.now()}` : undefined;

export interface UserPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const { user, checkSession } = useUser() as {
    user: UIUser | null;
    checkSession?: () => Promise<void>;
  };
  const router = useRouter();

  const displayName: string =
    [user?.firstName ?? '', user?.lastName ?? ''].join(' ').trim() ||
    (user?.email ? user.email.split('@')[0] : 'Usuário');
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  // cache-buster: muda a cada atualização de avatar
  const [seed, setSeed] = React.useState<number>(0);
  React.useEffect(() => setSeed(Date.now()), [user?.avatar]);

  // Mantém a última foto conhecida mesmo durante logout
  const [lastKnownAvatar, setLastKnownAvatar] = React.useState<string | undefined>();
  const [avatarSrc, setAvatarSrc] = React.useState<string | undefined>();
  
  React.useEffect(() => {
    if (user?.avatar) {
      // Atualiza a última foto conhecida quando há usuário com avatar
      setLastKnownAvatar(user.avatar);
      setAvatarSrc(withCacheBuster(user.avatar, seed));
    } else if (user && !user.avatar) {
      // Usuário existe mas não tem avatar, usa padrão
      setAvatarSrc(withCacheBuster(DEFAULT_AVATAR, seed));
    } else if (!user && lastKnownAvatar) {
      // Durante logout, mantém a última foto conhecida
      setAvatarSrc(withCacheBuster(lastKnownAvatar, seed));
    } else if (!user && !lastKnownAvatar) {
      // Sem usuário e sem foto conhecida, limpa
      setAvatarSrc(undefined);
    }
  }, [user, user?.avatar, seed, lastKnownAvatar]);

  const handleAvatarError = () => {
    if (user) {
      // Se há usuário, tenta usar imagem padrão
      setAvatarSrc(withCacheBuster(DEFAULT_AVATAR));
    } else if (lastKnownAvatar) {
      // Se não há usuário mas tem foto conhecida, mantém tentando
      setAvatarSrc(withCacheBuster(lastKnownAvatar));
    } else {
      // Sem nada, limpa
      setAvatarSrc(undefined);
    }
  };

  const handleSignOut = React.useCallback((e: React.MouseEvent) => {
    // Previne qualquer comportamento padrão
    e.preventDefault();
    e.stopPropagation();
    
    // Limpa o token ANTES de fechar o popover
    try {
      localStorage.removeItem('custom-auth-token');
      sessionStorage.clear();
    } catch (err) {
      logger.error('Error clearing token', err);
    }
    
    // Fecha o popover
    onClose();
    
    // Redireciona IMEDIATAMENTE - sem setTimeout
    // Usa replace para não deixar no histórico
    window.location.replace('/auth/sign-in');
  }, [onClose]);

  const handlePopoverClose = React.useCallback((event: {}, reason: string) => {
    onClose();
  }, [onClose]);

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      onClose={handlePopoverClose}
      open={open}
      slotProps={{ paper: { sx: { width: 240 } } }}
    >
      <Box sx={{ p: '16px 20px', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          key={user?.avatar || 'default'}   // força re-mount quando muda
          src={avatarSrc}
          alt={displayName}
          onError={handleAvatarError}
          sx={{ width: 40, height: 40, border: '2px solid', borderColor: 'divider' }}
        >
          {initial}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>{displayName}</Typography>
          <Typography color="text.secondary" variant="body2" noWrap>
            {user?.email || ''}
          </Typography>
        </Box>
      </Box>

      <Divider />

      <MenuList disablePadding sx={{ p: 1, '& .MuiMenuItem-root': { borderRadius: 1 } }}>
        <MenuItem component={RouterLink} href={paths.dashboard.settings} onClick={onClose}>
          <ListItemIcon>
            <GearSixIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Configurações
        </MenuItem>
        <MenuItem component={RouterLink} href={paths.dashboard.account} onClick={onClose}>
          <ListItemIcon>
            <UserIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Conta
        </MenuItem>
        <MenuItem 
          component="button"
          onClick={handleSignOut}
          sx={{ width: '100%', textAlign: 'left' }}
        >
          <ListItemIcon>
            <SignOutIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </MenuList>
    </Popover>
  );
}
