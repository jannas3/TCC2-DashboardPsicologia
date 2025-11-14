export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', resetPassword: '/auth/reset-password' },
  dashboard: {
    overview: '/dashboard',
    triagem: '/dashboard/triagem',
    triagemHistorico: '/dashboard/triagem/historico',
    agendamento: '/dashboard/agendamento',
    atendimento: '/dashboard/atendimento',
    account: '/dashboard/account',
    alunos: '/dashboard/alunos',
    settings: '/dashboard/settings',
  },
  errors: { notFound: '/errors/not-found' },
} as const;
