'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AvatarUploader from '../account/AvatarUploader';
import { useUser } from '@/hooks/use-user';

type UIUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatar?: string | null;
};

export function AccountInfo(): React.JSX.Element {
  // Tipagem local para evitar 'unknown'
  const { user, checkSession } = useUser() as {
    user: UIUser | null;
    checkSession?: () => Promise<void>;
  };

  // Gera uma string garantida
  const displayName =
    [user?.firstName ?? '', user?.lastName ?? ''].join(' ').trim() ||
    (user?.email ? user.email.split('@')[0] : 'Usuário');

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <AvatarUploader
            src={user?.avatar ?? null}
            onUploaded={async () => {
              await checkSession?.();
            }}
          />
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Typography variant="h5">{displayName}</Typography>
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions />
    </Card>
  );
}
