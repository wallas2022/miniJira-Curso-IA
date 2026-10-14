import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './theme-context';

const STORAGE_KEY = 'mj-theme';

function leerPreferenciaGuardada(): Theme | null {
  try {
    const guardada = localStorage.getItem(STORAGE_KEY);
    return guardada === 'light' || guardada === 'dark' ? guardada : null;
  } catch {
    return null;
  }
}

function temaInicial(): Theme {
  return (
    leerPreferenciaGuardada() ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(temaInicial);

  const setTheme = useCallback((nuevo: Theme) => {
    setThemeState(nuevo);
    document.documentElement.dataset.theme = nuevo;
    try {
      localStorage.setItem(STORAGE_KEY, nuevo);
    } catch {
      // Sin almacenamiento disponible: el tema solo dura la sesión.
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
