"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

const REFRESH_INTERVAL_MS = 2 * 60 * 1000;

interface BackgroundRefreshContextValue {
  register: (key: string, callback: () => Promise<void> | void) => () => void;
  triggerRefresh: () => Promise<void>;
}

const BackgroundRefreshContext =
  createContext<BackgroundRefreshContextValue | null>(null);

export function BackgroundRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const registryRef = useRef(new Map<string, () => Promise<void> | void>());

  const register = useCallback(
    (key: string, callback: () => Promise<void> | void) => {
      registryRef.current.set(key, callback);
      return () => {
        registryRef.current.delete(key);
      };
    },
    []
  );

  const runAllCallbacks = useCallback(async () => {
    await Promise.allSettled(
      Array.from(registryRef.current.values()).map((cb) => {
        try {
          return Promise.resolve(cb());
        } catch {
          return Promise.resolve();
        }
      })
    );
    window.dispatchEvent(new CustomEvent("background-refresh-complete"));
  }, []);

  const triggerRefresh = useCallback(async () => {
    await runAllCallbacks();
  }, [runAllCallbacks]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const el = document.activeElement;
      const isInputFocused =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el instanceof HTMLElement && el.isContentEditable);

      const hasOpenModal = !!document.querySelector('[role="dialog"]');

      if (isInputFocused || hasOpenModal) return;

      await runAllCallbacks();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [runAllCallbacks]);

  return (
    <BackgroundRefreshContext.Provider value={{ register, triggerRefresh }}>
      {children}
    </BackgroundRefreshContext.Provider>
  );
}

export function useBackgroundRefresh(
  key: string,
  callback: () => Promise<void> | void
) {
  const ctx = useContext(BackgroundRefreshContext);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!ctx) return;
    return ctx.register(key, () => callbackRef.current());
  }, [ctx, key]);
}

export function useBackgroundRefreshTrigger() {
  const ctx = useContext(BackgroundRefreshContext);
  return ctx?.triggerRefresh ?? null;
}
