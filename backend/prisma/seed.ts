import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// specs.md 4: "Existe al menos un Administrador inicial, creado en el despliegue (seed)".
// Datos placeholder de demo, no reales.
async function main() {
  const passwordHash = await bcrypt.hash('changeme123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@minijira.local' },
    update: {},
    create: { email: 'admin@minijira.local', passwordHash, rol: 'ADMIN' },
  });

  const usuario1 = await prisma.user.upsert({
    where: { email: 'ana@minijira.local' },
    update: {},
    create: { email: 'ana@minijira.local', passwordHash, rol: 'USUARIO' },
  });

  const usuario2 = await prisma.user.upsert({
    where: { email: 'bruno@minijira.local' },
    update: {},
    create: { email: 'bruno@minijira.local', passwordHash, rol: 'USUARIO' },
  });

  const proyecto = await prisma.project.upsert({
    where: { id: 'seed-proyecto-demo' },
    update: {},
    create: {
      id: 'seed-proyecto-demo',
      nombre: 'Proyecto Demo',
      descripcion: 'Proyecto de ejemplo para el prototipo (datos placeholder).',
      creadorId: usuario1.id,
    },
  });

  await prisma.ticket.upsert({
    where: { id: 'seed-ticket-1' },
    update: {},
    create: {
      id: 'seed-ticket-1',
      titulo: 'Configurar el tablero inicial',
      descripcion: 'Ticket de ejemplo en estado Por hacer.',
      estado: 'POR_HACER',
      prioridad: 'MEDIA',
      proyectoId: proyecto.id,
      creadorId: usuario1.id,
      responsables: { create: [{ userId: usuario1.id }] },
    },
  });

  await prisma.ticket.upsert({
    where: { id: 'seed-ticket-2' },
    update: {},
    create: {
      id: 'seed-ticket-2',
      titulo: 'Revisar accesibilidad del formulario de login',
      estado: 'EN_PROGRESO',
      prioridad: 'ALTA',
      proyectoId: proyecto.id,
      creadorId: usuario2.id,
      responsables: { create: [{ userId: usuario2.id }] },
    },
  });

  console.log('Seed aplicado:');
  console.log(`  Admin:   admin@minijira.local / changeme123`);
  console.log(`  Usuario: ana@minijira.local / changeme123`);
  console.log(`  Usuario: bruno@minijira.local / changeme123`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
