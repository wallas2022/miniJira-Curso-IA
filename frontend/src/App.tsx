import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { BoardPage } from './pages/BoardPage';
import { LoginPage } from './pages/LoginPage';
import { ProjectsPage } from './pages/ProjectsPage';

function RutaProtegida({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/proyectos"
        element={
          <RutaProtegida>
            <ProjectsPage />
          </RutaProtegida>
        }
      />
      <Route
        path="/proyectos/:id"
        element={
          <RutaProtegida>
            <BoardPage />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/proyectos" replace />} />
    </Routes>
  );
}

export default App;
