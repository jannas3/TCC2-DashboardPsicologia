'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import Image from 'next/image';
import Link from 'next/link';

import type { NavItemConfig } from '@/types/nav';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { useSideNavState } from '@/hooks/use-sidenav';
import { navItems } from './config';
import { navIcons } from './nav-icons';

export function SideNav(): React.JSX.Element {
  const pathname = usePathname();
  const { collapsed } = useSideNavState();

  const widthOpen = 260;
  const widthCollapsed = 72;

  const applyWidthVar = React.useCallback(
    (isCollapsed: boolean) => {
      if (typeof document !== 'undefined') {
        const width = isCollapsed ? widthCollapsed : widthOpen;
        document.documentElement.style.setProperty('--SideNav-width-current', `${width}px`);
      }
    },
    [widthCollapsed, widthOpen]
  );

  React.useEffect(() => {
    applyWidthVar(collapsed);
  }, [collapsed, applyWidthVar]);

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
        width: {
          lg: collapsed ? `${widthCollapsed}px` : `${widthOpen}px`,
        },
        transition: 'width .2s ease',
        overflow: 'hidden',
        pointerEvents: 'auto',
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
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Image
        src="/logo-ifam1.png"       // seu símbolo
        alt="Psicoflow"
        width={48}
        height={48}
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
          fontSize: '1.3rem',
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
        <Stack component="ul" spacing={0.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {navItems.map(({ key, ...item }) => (
            <Box component="li" key={key} sx={{ listStyle: 'none' }}>
              <NavItem pathname={pathname} collapsed={collapsed} {...item} />
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

interface NavItemProps extends NavItemConfig {
  pathname: string;
  collapsed?: boolean;
}

function NavItem({
  disabled,
  external,
  href,
  icon,
  matcher,
  pathname,
  title,
  collapsed = false,
}: NavItemProps): React.JSX.Element {
  const Icon = icon ? navIcons[icon] : null;
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });

  const baseStyles = {
    alignItems: 'center',
    borderRadius: 1,
    color: 'var(--NavItem-color)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    gap: 1,
    minHeight: 40,
    pl: '12px',
    pr: '12px',
    py: '6px',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    ...(active && {
      bgcolor: 'var(--NavItem-active-background)',
      color: 'var(--NavItem-active-color)',
    }),
    '&:hover': { bgcolor: 'var(--NavItem-hover-background)' },
  } as const;

  const componentProps = href
    ? {
        component: external ? 'a' : RouterLink,
        href,
        target: external ? '_blank' : undefined,
        rel: external ? 'noreferrer' : undefined,
      }
    : { role: 'button' as const };

  const content = (
    <Box
      {...componentProps}
      sx={{
        ...baseStyles,
        justifyContent: collapsed ? 'center' : 'flex-start',
        title: collapsed ? title : undefined,
      }}
    >
      {Icon ? (
        <Box sx={{ width: 36, display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
          <Icon
            fill={active ? 'var(--NavItem-icon-active-color)' : 'var(--NavItem-icon-color)'}
            fontSize="1.5rem"
            weight={active ? 'fill' : undefined}
          />
        </Box>
      ) : null}

      {!collapsed && (
        <Typography
          component="span"
          sx={{
            color: 'inherit',
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: '28px',
          }}
        >
          {title}
        </Typography>
      )}
    </Box>
  );

  if (collapsed) {
    return (
      <Tooltip title={title} placement="right" enterDelay={500}>
        <span>{content}</span>
      </Tooltip>
    );
  }

  return content;
}
