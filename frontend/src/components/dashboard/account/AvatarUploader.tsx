'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

type Props = {
  src?: string | null;
  onUploaded?: (url: string) => void; // chame checkSession() aqui se quiser
};

const MAX_MB = 2;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];

export default function AvatarUploader({ src, onUploaded }: Props) {
  const [preview, setPreview] = React.useState<string | undefined>(undefined);
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handlePick = () => inputRef.current?.click();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError('Use PNG, JPG ou WEBP.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Tamanho máximo: ${MAX_MB} MB.`);
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onSave = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
      const token = typeof window !== 'undefined' ? localStorage.getItem('custom-auth-token') : null;

      const fd = new FormData();
      fd.append('avatar', file);

      const res = await fetch(`${BASE_URL}/api/users/me/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Falha ao enviar imagem');

      // backend deve responder { avatarUrl: '...' }
      onUploaded?.(data.avatarUrl);
      setFile(null);
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={1} alignItems="center">
      <Avatar
        src={preview || src || undefined}
        sx={{ width: 96, height: 96 }}
      />
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        hidden
        onChange={onChange}
      />
      {error ? <Typography variant="caption" color="error">{error}</Typography> : null}
      {loading ? <LinearProgress sx={{ width: '100%' }} /> : null}
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="text" onClick={handlePick}>Selecionar</Button>
        <Button size="small" variant="contained" onClick={onSave} disabled={!file || loading}>
          Salvar
        </Button>
      </Stack>
    </Stack>
  );
}
