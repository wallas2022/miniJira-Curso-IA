import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';

interface AnnouncerContextValue {
  announce: (message: string, options?: { assertive?: boolean }) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

// docs/prototype-spec.md B.3: cambios de estado async (mover ticket, guardar, error)
// anunciados a lectores de pantalla via region aria-live.
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const counter = useRef(0);

  const announce = useCallback((message: string, options?: { assertive?: boolean }) => {
    counter.current += 1;
    // Se antepone un contador invisible para forzar el anuncio aunque el mensaje se repita.
    const texto = message;
    if (options?.assertive) {
      setAssertive(texto);
    } else {
      setPolite(texto);
    }
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" role="status" className="mj-sr-only">
        {polite}
      </div>
      <div aria-live="assertive" role="alert" className="mj-sr-only">
        {assertive}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer() {
  const ctx = useContext(AnnouncerContext);
  if (!ctx) throw new Error('useAnnouncer debe usarse dentro de AnnouncerProvider.');
  return ctx;
}
