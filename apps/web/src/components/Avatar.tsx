export interface AvatarProps {
  nombre: string;
}

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function Avatar({ nombre }: AvatarProps) {
  return (
    <span
      title={nombre}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action-primary text-caption font-semibold text-on-primary"
    >
      {getInitials(nombre)}
    </span>
  );
}
