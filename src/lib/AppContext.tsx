import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "./api";
import type { AppSetting } from "./types";

interface AppContextValue {
  whatsappNumber: string;
  settings: AppSetting | null;
  reloadSettings: () => void;
}

const AppContext = createContext<AppContextValue>({
  whatsappNumber: "",
  settings: null,
  reloadSettings: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSetting | null>(null);

  const load = () => {
    api
      .get<AppSetting>("/app-settings")
      .then(setSettings)
      .catch(() => {/* keep null — components fall back gracefully */});
  };

  useEffect(() => { load(); }, []);

  return (
    <AppContext.Provider
      value={{
        whatsappNumber: settings?.whatsappNumber ?? "",
        settings,
        reloadSettings: load,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
