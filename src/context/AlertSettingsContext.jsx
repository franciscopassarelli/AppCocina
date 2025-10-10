import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const LS_KEY = "alert_settings_v1";

const defaultSettings = {
  
  enabled: true,              
  showNavbarBadge: true,      
  paused: false,            
  pauseUntil: null,           
  showStock: true,            
  showExpiryUrgent: true,     
  showExpiryUpcoming: true,
};

const AlertSettingsContext = createContext(null);

function readLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}
function writeLS(settings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  } catch {}
}

export function AlertSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => readLS());

  useEffect(() => {
    writeLS(settings);
  }, [settings]);

  const isPausedNow = useMemo(() => {
    if (!settings.enabled) return true;
    if (settings.paused) return true;
    if (settings.pauseUntil) {
      const until = new Date(settings.pauseUntil).getTime();
      if (Number.isFinite(until) && until > Date.now()) return true;
    }
    return false;
  }, [settings]);

  const resumeNow = () =>
    setSettings((s) => ({ ...s, paused: false, pauseUntil: null, enabled: true }));

  const quickPauseHours = (hours) => {
    const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    setSettings((s) => ({ ...s, paused: false, pauseUntil: until, enabled: true }));
  };

  const pauseToday = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    setSettings((s) => ({ ...s, paused: false, pauseUntil: end.toISOString(), enabled: true }));
  };

  const value = {
    settings,
    setSettings,
    isPausedNow,
    resumeNow,
    quickPauseHours,
    pauseToday,
  };

  return (
    <AlertSettingsContext.Provider value={value}>
      {children}
    </AlertSettingsContext.Provider>
  );
}

export function useAlertSettings() {
  const ctx = useContext(AlertSettingsContext);
  if (!ctx) throw new Error("useAlertSettings debe usarse dentro de AlertSettingsProvider");
  return ctx;
}
