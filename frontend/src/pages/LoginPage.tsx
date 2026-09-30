import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// RF-07: login propio email + contrasena. Sin registro publico (docs/prototype-spec.md C.1).
export function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/proyectos" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/proyectos');
    } catch (err) {
      // Mensaje generico deliberado: no revela si el email existe (RNF-04).
      setError('Email o contrasena incorrectos.');
    }
  };

  return (
    <main className="mj-auth-screen">
      <form className="mj-card mj-auth-card" onSubmit={onSubmit} aria-labelledby="login-title">
        <h1 id="login-title">Mini Jira</h1>
        <p className="mj-text-secondary">Inicia sesion con tu cuenta.</p>

        <label className="mj-field">
          <span>Email</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </label>

        <label className="mj-field">
          <span>Contrasena</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </label>

        {error && (
          <div className="mj-banner mj-banner--error" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="mj-button mj-button--primary" disabled={loading}>
          {loading ? 'Ingresando...' : 'Iniciar sesion'}
        </button>

        <p className="mj-text-secondary mj-auth-hint">
          Demo: admin@minijira.local / changeme123
        </p>
      </form>
    </main>
  );
}
