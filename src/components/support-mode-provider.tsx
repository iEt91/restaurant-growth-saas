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

export function SupportModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = React.useState<SupportModeState>(() => {
    if (typeof window === "undefined") {
      return { active: false, restaurant: null };
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return { active: false, restaurant: null };
    }

    try {
      return JSON.parse(saved) as SupportModeState;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return { active: false, restaurant: null };
    }
  });

  React.useEffect(() => {
    if (state.active && state.restaurant) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  const value = React.useMemo<SupportModeContextValue>(
    () => ({
      ...state,
      enterSupportMode: (restaurant) =>
        setState({ active: true, restaurant }),
      exitSupportMode: () => setState({ active: false, restaurant: null }),
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
