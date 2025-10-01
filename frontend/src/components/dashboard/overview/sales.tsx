'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { alpha, useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import { ArrowClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import type { ApexOptions } from 'apexcharts';

import { Chart } from '@/components/core/chart';

export type Granularity = 'weekly' | 'monthly';

export interface SalesProps {
  /** Séries do gráfico. Ex.: [{ name: 'Agendados', data: [...] }, { name: 'Concluídos', data: [...] }] */
  chartSeries: { name: string; data: number[] }[];
  /** Categorias do eixo X (semana “01–07/09”, mês “set/2025”, etc.) */
  categories: string[];
  /** Granularidade atual (controlada pelo pai) */
  granularity?: Granularity;
  /** Callback quando usuário muda Semanas/Meses */
  onGranularityChange?: (g: Granularity) => void;
  /** Callback para recarregar dados */
  onSync?: () => void;
  sx?: SxProps;
}

export function Sales({
  chartSeries,
  categories,
  granularity = 'weekly',
  onGranularityChange,
  onSync,
  sx
}: SalesProps): React.JSX.Element {
  const chartOptions = useChartOptions(categories);

  return (
    <Card sx={sx}>
      <CardHeader
        title="Evolução dos atendimentos"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              size="small"
              color="primary"
              value={granularity}
              exclusive
              onChange={(_, v) => v && onGranularityChange?.(v)}
            >
              <ToggleButton value="weekly">Semanas</ToggleButton>
              <ToggleButton value="monthly">Meses</ToggleButton>
            </ToggleButtonGroup>
            <Button
              color="inherit"
              size="small"
              startIcon={<ArrowClockwiseIcon fontSize="var(--icon-fontSize-md)" />}
              onClick={onSync}
            >
              Sync
            </Button>
          </Stack>
        }
      />
      <CardContent>
        <Chart height={350} options={chartOptions} series={chartSeries} type="bar" width="100%" />
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button color="inherit" endIcon={<ArrowRightIcon fontSize="var(--icon-fontSize-md)" />} size="small">
          Overview
        </Button>
      </CardActions>
    </Card>
  );
}

function useChartOptions(categories: string[]): ApexOptions {
  const theme = useTheme();

  return {
    chart: { background: 'transparent', stacked: true, toolbar: { show: false } },
    colors: [
      theme.palette.primary.main,                    // Série 1 (ex.: Agendados)
      theme.palette.success.main,                    // Série 2 (ex.: Concluídos)
      alpha(theme.palette.primary.main, 0.25),       // (extra, se houver 3ª série)
    ],
    dataLabels: { enabled: false },
    fill: { opacity: 1, type: 'solid' },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: { show: true },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    theme: { mode: theme.palette.mode },
    xaxis: {
      categories,
      axisBorder: { color: theme.palette.divider, show: true },
      axisTicks: { color: theme.palette.divider, show: true },
      labels: { offsetY: 5, style: { colors: theme.palette.text.secondary } },
    },
    yaxis: {
      labels: {
        formatter: (value) => `${Math.round(value)}`,
        offsetX: -10,
        style: { colors: theme.palette.text.secondary },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  };
}
