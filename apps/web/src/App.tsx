import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { BoardPage } from './features/tickets/BoardPage';

// Una sola instancia para toda la app. Sin reintentos automáticos: los errores de la API
// (RFC 7807) se muestran al usuario, no se reintentan en silencio.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Navigate to="/proyectos" replace />} />
        <Route
          path="/proyectos"
          element={
            <AppShell>
              <ProjectsPage />
            </AppShell>
          }
        />
        <Route
          path="/proyectos/:id"
          element={
            <AppShell>
              <BoardPage />
            </AppShell>
          }
        />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
