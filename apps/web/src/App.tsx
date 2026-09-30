import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { ProjectsPage } from './features/projects/ProjectsPage';

// Placeholder temporal: BoardPage (tablero de un proyecto) no se construye
// en esta fase (fuera de alcance, ver plan de la Vista de Proyectos).
function BoardPagePlaceholder() {
  return <p className="p-(--mj-space-5) text-body text-secondary">Tablero en construcción.</p>;
}

function App() {
  return (
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
            <BoardPagePlaceholder />
          </AppShell>
        }
      />
    </Routes>
  );
}

export default App;
