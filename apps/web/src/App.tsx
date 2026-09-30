import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { BoardPage } from './features/tickets/BoardPage';

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
            <BoardPage />
          </AppShell>
        }
      />
    </Routes>
  );
}

export default App;
