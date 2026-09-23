import express from 'express';
import authRoutes from './routes/auth.routes';
import projectsRoutes from './routes/projects.routes';
import ticketsRoutes from './routes/tickets.routes';
import reportesRoutes from './routes/reportes.routes';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/reportes', reportesRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Mini Jira backend escuchando en puerto ${PORT}`);
});
