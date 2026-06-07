"use client";

import * as React from "react";
import type { Restaurant } from "@/types/domain";
import type { ReactNode } from "react";

type SupportModeState = {
  active: boolean;
  restaurant: Restaurant | null;
};

type SupportModeContextValue = SupportModeState & {
  enterSupportMode: (restaurant: Restaurant) => void;
  exitSupportMode: () => void;
};

const SupportModeContext = React.createContext<SupportModeContextValue | null>(
  null
);

const STORAGE_KEY = "restaurant-growth-saas-support-mode";
const SUPPORT_MODE_CHANGE_EVENT = "restaurant-growth-saas-support-mode-change";

function getDefaultState(): SupportModeState {
  return { active: false, restaurant: null };
}

function readStateFromStorage(): SupportModeState {
  if (typeof window === "undefined") {
    return getDefaultState();
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return getDefaultState();
  }

  try {
    return JSON.parse(saved) as SupportModeState;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return getDefaultState();
  }
}

function writeStateToStorage(state: SupportModeState) {
  if (typeof window === "undefined") return;

  if (state.active && state.restaurant) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  window.dispatchEvent(new Event(SUPPORT_MODE_CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => callback();

  window.addEventListener("storage", handler);
  window.addEventListener(SUPPORT_MODE_CHANGE_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(SUPPORT_MODE_CHANGE_EVENT, handler);
  };
}

export function SupportModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const state = React.useSyncExternalStore(
    subscribe,
    readStateFromStorage,
    getDefaultState
  );

  const value = React.useMemo<SupportModeContextValue>(
    () => ({
      ...state,
      enterSupportMode: (restaurant) =>
        writeStateToStorage({ active: true, restaurant }),
      exitSupportMode: () => writeStateToStorage({ active: false, restaurant: null }),
    }),
    [state]
  );

  return (
    <SupportModeContext.Provider value={value}>
      {children}
    </SupportModeContext.Provider>
  );
}

export function useSupportMode() {
  const context = React.useContext(SupportModeContext);

  if (!context) {
    throw new Error("useSupportMode must be used within SupportModeProvider");
  }

  return context;
}
