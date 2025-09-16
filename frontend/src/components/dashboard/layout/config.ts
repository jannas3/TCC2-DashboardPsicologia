import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Início', href: paths.dashboard.overview, icon: 'chart-pie' },
  { key: 'triagem', title: 'Triagem', href: paths.dashboard.triagem, icon: 'clipboard-text' },
  { key: 'agendamento', title: 'Agendamento', href: paths.dashboard.agendamento, icon: 'calendar' },
  { key: 'atendimento', title: 'Atendimento', href: paths.dashboard.atendimento, icon: 'chat-circle-dots' },
  { key: 'alunos', title: 'Alunos', href: paths.dashboard.alunos, icon: 'users' },
  
  { key: 'settings', title: 'Configurações', href: paths.dashboard.settings, icon: 'gear-six' },
  { key: 'account', title: 'Conta', href: paths.dashboard.account, icon: 'user-circle' },
  { key: 'error', title: 'Erro', href: paths.errors.notFound, icon: 'warning' },
] satisfies NavItemConfig[];
