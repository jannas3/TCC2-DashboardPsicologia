"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "psico-sidenav-open";
const LEGACY_KEY = "psico-sidenav-hidden";

const EVENT_CHANGED = "psico-sidenav-open-changed";
const EVENT_TOGGLE = "psico-toggle-sidenav";
const EVENT_SET = "psico-set-sidenav-open";
const LEGACY_TOGGLE_EVENT = "psico-toggle-sidenav-hidden";

type SideNavEventDetail = {
  open: boolean;
};

function readInitialState(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "true";

    const legacyHidden = window.localStorage.getItem(LEGACY_KEY);
    if (legacyHidden !== null) return legacyHidden !== "1";
  } catch {
    /* ignore */
  }

  return true;
}

function dispatchChange(open: boolean) {
  if (typeof window === "undefined") return;
  // dispara em microtask para evitar setState durante render de outro componente
  queueMicrotask(() => {
    window.dispatchEvent(
      new CustomEvent<SideNavEventDetail>(EVENT_CHANGED, {
        detail: { open },
      })
    );
  });
}

export interface SideNavState {
  open: boolean;
  collapsed: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
}

export function useSideNavState(): SideNavState {
  const [open, setOpenState] = useState<boolean>(() => readInitialState());

  const persist = useCallback((value: boolean) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
      window.localStorage.setItem(LEGACY_KEY, value ? "0" : "1");
    } catch {
      /* ignore storage errors */
    }
    dispatchChange(value);
  }, []);

  // Ensure CSS watchers get the initial value
  useEffect(() => {
    persist(open);
    // we only want to run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setOpen = useCallback(
    (value: boolean) => {
      setOpenState(value);
      persist(value);
    },
    [persist]
  );

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
  }, [persist]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleToggle = () => {
      toggle();
    };

    const handleSet = (event: Event) => {
      const custom = event as CustomEvent<SideNavEventDetail>;
      if (typeof custom.detail?.open === "boolean") {
        setOpenState(custom.detail.open);
        persist(custom.detail.open);
      }
    };

    const handleChanged = (event: Event) => {
      const custom = event as CustomEvent<SideNavEventDetail>;
      if (typeof custom.detail?.open === "boolean") {
        setOpenState(custom.detail.open);
      }
    };

    window.addEventListener(EVENT_TOGGLE, handleToggle);
    window.addEventListener(LEGACY_TOGGLE_EVENT, handleToggle);
    window.addEventListener(EVENT_SET, handleSet as EventListener);
    window.addEventListener(EVENT_CHANGED, handleChanged as EventListener);

    return () => {
      window.removeEventListener(EVENT_TOGGLE, handleToggle);
      window.removeEventListener(LEGACY_TOGGLE_EVENT, handleToggle);
      window.removeEventListener(EVENT_SET, handleSet as EventListener);
      window.removeEventListener(EVENT_CHANGED, handleChanged as EventListener);
    };
  }, [persist, toggle]);

  const collapsed = useMemo(() => !open, [open]);

  return {
    open,
    collapsed,
    toggle,
    setOpen,
  };
}


