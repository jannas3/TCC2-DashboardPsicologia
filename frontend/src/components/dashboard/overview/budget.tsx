import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { ArrowDownIcon } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { ArrowUpIcon } from '@phosphor-icons/react/dist/ssr/ArrowUp';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';

export interface BudgetProps {
  /** Valor principal exibido (aceita string ou number) */
  value: string | number;
  /** Diferença percentual (mostra a badge se definido) */
  diff?: number;
  /** Direção da tendência (define cor/ícone) */
  trend?: 'up' | 'down';
  /** Título do card (antes era fixo) */
  title?: string;
  /** Subtítulo/legenda (ex.: "últimos 60 dias") */
  subtitle?: string;
  /** Texto do período de comparação (ex.: "vs. mês anterior") */
  trendPeriodText?: string;
  /** Ícone do avatar (fallback = Users) */
  icon?: React.ElementType;
  /** Cor do avatar (fallback = primary) */
  avatarColor?: string;
  /** Loading state (renderiza skeletons) */
  loading?: boolean;
  sx?: SxProps;
}

export function Budget({
  value,
  diff,
  trend = 'up',
  title = 'Alunos atendidos',
  subtitle,
  trendPeriodText = 'vs. mês anterior',
  icon: IconComp,
  avatarColor = 'var(--mui-palette-primary-main)',
  loading = false,
  sx,
}: BudgetProps): React.JSX.Element {
  const TrendIcon = trend === 'up' ? ArrowUpIcon : ArrowDownIcon;
  const trendColor =
    trend === 'up' ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-error-main)';
  const DisplayIcon = IconComp ?? Users;

  return (
    <Card sx={sx}>
      <CardContent>
        <Stack spacing={3}>
          <Stack
            direction="row"
            sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
            spacing={3}
          >
            <Stack spacing={1}>
              {loading ? (
                <>
                  <Skeleton variant="text" width={140} />
                  <Skeleton variant="text" width={90} sx={{ fontSize: '2rem' }} />
                </>
              ) : (
                <>
                  <Typography color="text.secondary" variant="overline">
                    {title}
                  </Typography>
                  <Typography variant="h4">
                    {typeof value === 'number' ? value.toString() : value}
                  </Typography>
                </>
              )}
              {!loading && subtitle ? (
                <Typography color="text.secondary" variant="caption">
                  {subtitle}
                </Typography>
              ) : null}
            </Stack>

            <Avatar sx={{ backgroundColor: avatarColor, height: 56, width: 56 }}>
              <DisplayIcon fontSize="var(--icon-fontSize-lg)" />
            </Avatar>
          </Stack>

          {!loading && diff !== undefined ? (
            <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
              <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                <TrendIcon color={trendColor} fontSize="var(--icon-fontSize-md)" />
                <Typography color={trendColor} variant="body2">
                  {diff}%
                </Typography>
              </Stack>
              <Typography color="text.secondary" variant="caption">
                {trendPeriodText}
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
