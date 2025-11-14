'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ArrowSquareUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareUpRight';
import { CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr/CaretUpDown';
import Image from 'next/image';
import Link from 'next/link';

import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { Logo } from '@/components/core/logo';

import { navItems } from './config';
import { navIcons } from './nav-icons';

export interface MobileNavProps {
  onClose?: () => void;
  open?: boolean;
  items?: NavItemConfig[];
}

export function MobileNav({ open, onClose }: MobileNavProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <Drawer
      PaperProps={{
        sx: {
          '--MobileNav-background': 'var(--mui-palette-neutral-950)',
          '--MobileNav-color': 'var(--mui-palette-common-white)',
          '--NavItem-color': 'var(--mui-palette-neutral-300)',
          '--NavItem-hover-background': 'rgba(255, 255, 255, 0.04)',
          '--NavItem-active-background': 'var(--mui-palette-primary-main)',
          '--NavItem-active-color': 'var(--mui-palette-primary-contrastText)',
          '--NavItem-disabled-color': 'var(--mui-palette-neutral-500)',
          '--NavItem-icon-color': 'var(--mui-palette-neutral-400)',
          '--NavItem-icon-active-color': 'var(--mui-palette-primary-contrastText)',
          '--NavItem-icon-disabled-color': 'var(--mui-palette-neutral-600)',
          bgcolor: 'var(--MobileNav-background)',
          color: 'var(--MobileNav-color)',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%',
          scrollbarWidth: 'none',
          width: 'var(--MobileNav-width)',
          zIndex: 'var(--MobileNav-zIndex)',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      }}
      onClose={onClose}
      open={open}
    >
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
          lineHeight: 1,          // ⬅️ evita “descer” pela linha-base
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
      <Box component="nav" sx={{ flex: '1 1 auto', p: '12px 0 0 0' }}>
        {renderNavItems({ pathname, items: navItems })}
      </Box>
    </Drawer>
  );
}

function renderNavItems({
  items = [],
  pathname,
  depth = 0,
}: {
  items?: NavItemConfig[];
  pathname: string;
  depth?: number;
}): React.JSX.Element {
  return (
    <Stack component="ul" spacing={0.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map(({ key, items: childItems, ...item }) => (
        <Box component="li" key={key} sx={{ listStyle: 'none' }}>
          <NavItem pathname={pathname} depth={depth} {...item} />
          {childItems?.length ? (
            <Box sx={{ mt: 0.5, pl: depth === 0 ? 3 : 2 }}>
              {renderNavItems({ items: childItems, pathname, depth: depth + 1 })}
            </Box>
          ) : null}
        </Box>
      ))}
    </Stack>
  );
}

interface NavItemProps extends Omit<NavItemConfig, 'items'> {
  pathname: string;
  depth?: number;
}

function NavItem({
  disabled,
  external,
  href,
  icon,
  matcher,
  pathname,
  title,
  depth = 0,
}: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = depth === 0 && icon ? navIcons[icon] : null;

  return (
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
        flex: '0 0 auto',
        gap: 1,
        minHeight: 40,
        pl: depth === 0 ? '16px' : `${16 + depth * 16}px`,
        pr: '16px',
        py: '6px',
        position: 'relative',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        ...(disabled && {
          bgcolor: 'var(--NavItem-disabled-background)',
          color: 'var(--NavItem-disabled-color)',
          cursor: 'not-allowed',
        }),
        ...(active && { bgcolor: 'var(--NavItem-active-background)', color: 'var(--NavItem-active-color)' }),
      }}
    >
      {Icon ? (
        <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
          <Icon
            fill={active ? 'var(--NavItem-icon-active-color)' : 'var(--NavItem-icon-color)'}
            fontSize="var(--icon-fontSize-md)"
            weight={active ? 'fill' : undefined}
          />
        </Box>
      ) : null}
      <Box sx={{ flex: '1 1 auto' }}>
        <Typography
          component="span"
          sx={{
            color: 'inherit',
            fontSize: '0.875rem',
            fontWeight: depth === 0 ? 500 : 400,
            lineHeight: '28px',
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  );
}
