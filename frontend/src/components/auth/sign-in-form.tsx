'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { EnvelopeSimple, Lock, Eye, EyeSlash } from '@phosphor-icons/react';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

const schema = zod.object({
  email: zod.string().min(1, { message: 'Informe seu email profissional' }).email(),
  password: zod.string().min(1, { message: 'Informe sua senha' })
});
type Values = zod.infer<typeof schema>;
const defaultValues: Values = { email: '', password: '' };

export function SignInForm(): React.JSX.Element {
  const router = useRouter();
  const { checkSession } = useUser();

  const [showPassword, setShowPassword] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);
      const { error } = await authClient.signInWithPassword(values);
      if (error) {
        setError('root', { type: 'server', message: error });
        setIsPending(false);
        return;
      }
      await checkSession?.();
      router.refresh();
    },
    [checkSession, router, setError]
  );

  return (
    <Stack spacing={2}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormControl error={Boolean(errors.email)}>
                <InputLabel>Email Profissional</InputLabel>
                <OutlinedInput
                  {...field}
                  label="Email Profissional"
                  type="email"
                  placeholder="seu@email.com"
                  startAdornment={
                    <InputAdornment position="start">
                      <EnvelopeSimple size={20} />
                    </InputAdornment>
                  }
                />
                {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormControl error={Boolean(errors.password)}>
                <InputLabel>Senha</InputLabel>
                <OutlinedInput
                  {...field}
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  startAdornment={
                    <InputAdornment position="start">
                      <Lock size={20} />
                    </InputAdornment>
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      {showPassword ? (
                        <Eye
                          size={20}
                          cursor="pointer"
                          onClick={() => setShowPassword(false)}
                          aria-label="Ocultar senha"
                        />
                      ) : (
                        <EyeSlash
                          size={20}
                          cursor="pointer"
                          onClick={() => setShowPassword(true)}
                          aria-label="Mostrar senha"
                        />
                      )}
                    </InputAdornment>
                  }
                />
                {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
              </FormControl>
            )}
          />

          <Stack direction="row" justifyContent="flex-end">
            <Link component={RouterLink} href={paths.auth.resetPassword} variant="subtitle2">
              Esqueceu sua senha?
            </Link>
          </Stack>

          {/* erro de autenticação */}
          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}

          <Button disabled={isPending} type="submit" variant="contained" size="large">
            Acessar Plataforma
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
