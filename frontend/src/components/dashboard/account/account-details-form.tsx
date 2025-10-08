'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid'; // <- Grid clássico (correto p/ sua versão)
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Alert from '@mui/material/Alert';
import { useUser } from '@/hooks/use-user';

type UIUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export function AccountDetailsForm(): React.JSX.Element {
  const { user, checkSession } = useUser() as {
    user: UIUser | null;
    checkSession?: () => Promise<void>;
  };

  const [firstName, setFirstName] = React.useState<string>(user?.firstName ?? '');
  const [lastName, setLastName]   = React.useState<string>(user?.lastName ?? '');
  const [email] = React.useState<string>(user?.email ?? '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError]   = React.useState<string | null>(null);
  const [ok, setOk]         = React.useState(false);

  React.useEffect(() => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
  }, [user?.firstName, user?.lastName]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(false);
    setError(null);
    try {
      setSaving(true);
      const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
      const token = typeof window !== 'undefined' ? localStorage.getItem('custom-auth-token') : null;

      const body = { firstName, lastName }; // backend monta name = "first last"
      const res = await fetch(`${BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Falha ao salvar');

      await checkSession?.();
      setOk(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader subheader="Suas informações" title="Perfil" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>First name</InputLabel>
                <OutlinedInput
                  label="First name"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Last name</InputLabel>
                <OutlinedInput
                  label="Last name"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Email</InputLabel>
                <OutlinedInput label="Email" name="email" value={email} disabled />
              </FormControl>
            </Grid>
          </Grid>

          {error ? <Alert sx={{ mt: 2 }} severity="error">{error}</Alert> : null}
          {ok ? <Alert sx={{ mt: 2 }} severity="success">Dados salvos!</Alert> : null}
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}
