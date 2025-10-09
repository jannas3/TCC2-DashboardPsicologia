'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Image from 'next/image';
import Link from 'next/link';

import type { NavItemConfig } from '@/types/nav';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { navItems } from './config';
import { navIcons } from './nav-icons';

export function SideNav(): React.JSX.Element {
  const pathname = usePathname();
 const widthOpen = 260;

  const [hidden, setHidden] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('psico-sidenav-hidden') === '1';
  });

  const applyWidthVar = React.useCallback((isHidden: boolean) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(
        '--SideNav-width-current',
        isHidden ? '0px' : `${widthOpen}px`
      );
    }
  }, []);

  React.useEffect(() => {
    applyWidthVar(hidden);
  }, [hidden, applyWidthVar]);

  React.useEffect(() => {
    const onToggleHidden = () => {
      setHidden(prev => {
        const next = !prev;
        try {
          window.localStorage.setItem('psico-sidenav-hidden', next ? '1' : '0');
        } catch {}
        applyWidthVar(next);
        return next;
      });
    };
    window.addEventListener('psico-toggle-sidenav-hidden', onToggleHidden);
    return () => window.removeEventListener('psico-toggle-sidenav-hidden', onToggleHidden);
  }, [applyWidthVar]);

  return (
    <Box
      sx={{
        '--SideNav-background': 'var(--mui-palette-neutral-950)',
        '--SideNav-color': 'var(--mui-palette-common-white)',
        '--NavItem-color': 'var(--mui-palette-neutral-300)',
        '--NavItem-hover-background': 'rgba(255, 255, 255, 0.04)',
        '--NavItem-active-background': 'var(--mui-palette-primary-main)',
        '--NavItem-active-color': 'var(--mui-palette-primary-contrastText)',
        '--NavItem-icon-color': 'var(--mui-palette-neutral-400)',
        '--NavItem-icon-active-color': 'var(--mui-palette-primary-contrastText)',
        bgcolor: 'var(--SideNav-background)',
        color: 'var(--SideNav-color)',
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        height: '100dvh',
        left: 0,
        top: 0,
        position: 'fixed',
        width: { lg: hidden ? '0px' : `${widthOpen}px` },
        transition: 'width .2s ease',
        overflow: 'hidden',
        visibility: hidden ? 'hidden' : 'visible',
        pointerEvents: hidden ? 'none' : 'auto',
        zIndex: 'var(--SideNav-zIndex)',
      }}
    >
      {/* Logo/brand */}
     
{/* Logo */}
      <Box
        sx={{
          px: 2,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Image
        src="/logo-ifam1.png"       // seu símbolo
        alt="Psicoflow"
        width={30}
        height={30}
        priority
        style={{
          display: 'block',
          objectFit: 'contain',
          objectPosition: 'center'
        }}
      />

      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: '1.05rem',
          lineHeight: 1,
          letterSpacing: '-0.01em',
          color: '#E0E0E0'
        }}
      >
        Psicoflow
      </Typography>
    </Stack>
  </Link>
</Box>


      <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)', mb: 1 }} />

      {/* navegação */}
      <Box component="nav" sx={{ flex: 1, p: '12px 0 0 0' }}>
        {renderNavItems({ pathname, items: navItems })}
      </Box>
    </Box>
  );
}

function renderNavItems({
  items = [],
  pathname,
}: {
  items?: NavItemConfig[];
  pathname: string;
}): React.JSX.Element {
  const children = items.map(({ key, ...item }) => (
    <NavItem key={key} pathname={pathname} {...item} />
  ));

  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {children}
    </Stack>
  );
}

interface NavItemProps extends Omit<NavItemConfig, 'items'> {
  pathname: string;
}

function NavItem({
  disabled,
  external,
  href,
  icon,
  matcher,
  pathname,
  title,
}: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon ? navIcons[icon] : null;

  return (
    <li>
      <Box
        {...(href
          ? {
              component: external ? 'a' : RouterLink,
              href,
              target: external ? '_blank' : undefined,
              rel: external ? 'noreferrer' : undefined,
            }
          : { role: 'button' })}
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          color: 'var(--NavItem-color)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          gap: 1,
          p: '6px 12px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          ...(active && {
            bgcolor: 'var(--NavItem-active-background)',
            color: 'var(--NavItem-active-color)',
          }),
          '&:hover': { bgcolor: 'var(--NavItem-hover-background)' },
        }}
      >
        <Box sx={{ width: 28, display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
          {Icon ? (
            <Icon
              fill={active ? 'var(--NavItem-icon-active-color)' : 'var(--NavItem-icon-color)'}
              fontSize="var(--icon-fontSize-md)"
              weight={active ? 'fill' : undefined}
            />
          ) : null}
        </Box>

        <Typography
          component="span"
          sx={{
            color: 'inherit',
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: '28px',
          }}
        >
          {title}
        </Typography>
      </Box>
    </li>
  );
}
