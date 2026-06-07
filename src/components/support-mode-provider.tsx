"use client";

import * as React from "react";
import type { ReactNode } from "react";
import type { Restaurant } from "@/types/domain";

type SupportModeState = {
  active: boolean;
  restaurant: Restaurant | null;
};

type SupportModeContextValue = SupportModeState & {
  enterSupportMode: (restaurant: Restaurant) => void;
  exitSupportMode: () => void;
};

const STORAGE_KEY = "restaurant-growth-saas-support-mode";

const defaultSupportModeState: SupportModeState = {
  active: false,
  restaurant: null,
};

let supportModeSnapshot: SupportModeState = defaultSupportModeState;
let supportModeSnapshotSerialized = JSON.stringify(defaultSupportModeState);
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function setSupportModeSnapshot(nextState: SupportModeState) {
  const nextSerialized = JSON.stringify(nextState);
  if (supportModeSnapshotSerialized === nextSerialized) {
    return;
  }

  supportModeSnapshot = nextState;
  supportModeSnapshotSerialized = nextSerialized;
  notifyListeners();
}

function readSupportModeStateFromStorage(): SupportModeState {
  if (typeof window === "undefined") {
    return defaultSupportModeState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultSupportModeState;
  }

  try {
    const parsed = JSON.parse(raw) as SupportModeState;
    if (parsed.active && parsed.restaurant) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return defaultSupportModeState;
}

function syncSupportModeFromStorage() {
  const nextState = readSupportModeStateFromStorage();
  setSupportModeSnapshot(nextState);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return supportModeSnapshot;
}

function getServerSnapshot() {
  return defaultSupportModeState;
}

function persistSupportModeState(nextState: SupportModeState) {
  setSupportModeSnapshot(nextState);

  if (nextState.active && nextState.restaurant) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function SupportModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  React.useEffect(() => {
    syncSupportModeFromStorage();
  }, []);

  const state = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const enterSupportMode = React.useCallback((restaurant: Restaurant) => {
    persistSupportModeState({ active: true, restaurant });
  }, []);

  const exitSupportMode = React.useCallback(() => {
    persistSupportModeState(defaultSupportModeState);
  }, []);

  const value = React.useMemo<SupportModeContextValue>(
    () => ({
      ...state,
      enterSupportMode,
      exitSupportMode,
    }),
    [state, enterSupportMode, exitSupportMode]
  );

  return (
    <SupportModeContext.Provider value={value}>
      {children}
    </SupportModeContext.Provider>
  );
}

const SupportModeContext = React.createContext<SupportModeContextValue | null>(
  null
);

export function useSupportMode() {
  const context = React.useContext(SupportModeContext);

  if (!context) {
    throw new Error("useSupportMode must be used within SupportModeProvider");
  }

  return context;
}
