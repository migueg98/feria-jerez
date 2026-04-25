import { useMemo } from 'react';

/**
 * Botón flotante (esquina inferior derecha) para abrir el calendario.
 * Si hay actuaciones próximas (en las siguientes 2 h) muestra un badge.
 */
export default function CalendarFab({ actuaciones, onClick }) {
  const upcoming = useMemo(() => {
    if (!actuaciones?.length) return 0;
    const now = Date.now();
    const max = now + 2 * 60 * 60 * 1000;
    return actuaciones.filter((a) => {
      const t = new Date(a.inicio).getTime();
      return t >= now && t <= max;
    }).length;
  }, [actuaciones]);

  return (
    <button
      type="button"
      className="calendar-fab"
      onClick={onClick}
      aria-label="Abrir calendario de actuaciones"
      title="Calendario de actuaciones"
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      {upcoming > 0 && <span className="calendar-fab-badge">{upcoming}</span>}
    </button>
  );
}
