import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Dashboard', href: paths.dashboard.overview, icon: 'house' },
  {
    key: 'triagens-recentes',
    title: 'Triagens Recentes',
    href: paths.dashboard.triagem,
    icon: 'clipboard-text',
    matcher: { type: 'equals', href: paths.dashboard.triagem },
  },
  {
    key: 'historico-triagens',
    title: 'Histórico de Triagens',
    href: paths.dashboard.triagemHistorico,
    icon: 'clipboard-text',
    matcher: { type: 'equals', href: paths.dashboard.triagemHistorico },
  },
  { key: 'agendamento', title: 'Agendamento', href: paths.dashboard.agendamento, icon: 'calendar' },
  { key: 'atendimento', title: 'Atendimento', href: paths.dashboard.atendimento, icon: 'chat-circle-dots' },
  { key: 'alunos', title: 'Alunos', href: paths.dashboard.alunos, icon: 'users' },
  { key: 'settings', title: 'Configurações', href: paths.dashboard.settings, icon: 'gear-six' },
  { key: 'account', title: 'Conta', href: paths.dashboard.account, icon: 'user' },
] satisfies NavItemConfig[];
