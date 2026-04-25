import { useEffect, useMemo, useRef, useState } from 'react';
import Lightbox from './Lightbox.jsx';

/**
 * Modal a pantalla completa con la lista cronológica de actuaciones.
 * - Agrupa por día
 * - Inserta una marca "AHORA" en su posición temporal real
 * - Hace auto-scroll a esa posición al abrir
 * - Eventos pasados aparecen con clase is-past + badge "Finalizado"
 * - Click en una actuación → modal de detalle
 */

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDayLabel(d) {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const day = startOfDay(d);
  if (day.getTime() === today.getTime()) return 'Hoy';
  if (day.getTime() === tomorrow.getTime()) return 'Mañana';
  return `${DIAS_SEMANA[day.getDay()]} ${day.getDate()} de ${MESES[day.getMonth()]}`;
}

function formatHora(d) {
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function dayKey(d) {
  const x = startOfDay(d);
  return x.toISOString().slice(0, 10);
}

export default function CalendarSheet({
  open,
  actuaciones,
  casetas,
  onClose,
  onSelectCaseta,
}) {
  const [detail, setDetail] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const scrollRef = useRef(null);
  const nowMarkerRef = useRef(null);

  // Refrescamos "now" cada minuto para que la marca AHORA y los "Finalizado"
  // se vayan actualizando si la pestaña está abierta.
  useEffect(() => {
    if (!open) return undefined;
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, [open]);

  const casetaById = useMemo(() => {
    const m = new Map();
    (casetas || []).forEach((c) => m.set(c.id, c));
    return m;
  }, [casetas]);

  // Agrupamos por día e insertamos un "now-marker" virtual en su día.
  const grouped = useMemo(() => {
    if (!actuaciones?.length) return [];
    const sorted = [...actuaciones].sort((a, b) =>
      a.inicio.localeCompare(b.inicio),
    );
    const map = new Map();
    sorted.forEach((a) => {
      const d = new Date(a.inicio);
      const k = dayKey(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(a);
    });

    // Si hoy no tiene actuaciones, añadimos el día "vacío" para que se vea AHORA
    const todayKey = dayKey(now);
    if (!map.has(todayKey)) map.set(todayKey, []);

    const days = [...map.keys()].sort();
    return days.map((k) => ({
      key: k,
      date: new Date(`${k}T00:00:00`),
      items: map.get(k),
    }));
  }, [actuaciones, now]);

  // Auto-scroll a "AHORA" cuando se abre.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (nowMarkerRef.current && scrollRef.current) {
        const top =
          nowMarkerRef.current.offsetTop -
          scrollRef.current.clientHeight / 3;
        scrollRef.current.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
      }
    }, 50);
    return () => clearTimeout(t);
  }, [open, grouped]);

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleVerEnMapa = (casetaId) => {
    onSelectCaseta?.(casetaId);
    onClose?.();
  };

  return (
    <>
      <div className="calendar-overlay" onClick={onClose} />
      <section
        className="calendar-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Calendario de actuaciones"
      >
        <header className="calendar-header">
          <div>
            <h2>Actuaciones</h2>
            <p className="calendar-subtitle">
              {actuaciones?.length
                ? `${actuaciones.length} actuación${actuaciones.length === 1 ? '' : 'es'} programada${actuaciones.length === 1 ? '' : 's'}`
                : 'Aún no hay actuaciones publicadas'}
            </p>
          </div>
          <button
            type="button"
            className="calendar-close"
            onClick={onClose}
            aria-label="Cerrar calendario"
          >
            ×
          </button>
        </header>

        <div ref={scrollRef} className="calendar-scroll">
          {grouped.length === 0 && (
            <div className="calendar-empty">
              <p>Todavía no se han publicado actuaciones.</p>
              <p className="muted">Vuelve pronto, las iremos añadiendo.</p>
            </div>
          )}

          {grouped.map((group) => {
            const isToday =
              startOfDay(group.date).getTime() === startOfDay(now).getTime();
            return (
              <div key={group.key} className="calendar-day">
                <div className={`calendar-day-header ${isToday ? 'is-today' : ''}`}>
                  {formatDayLabel(group.date)}
                </div>
                <div className="calendar-day-list">
                  {/* Si es hoy y no hay items todavía */}
                  {isToday && group.items.length === 0 && (
                    <div ref={nowMarkerRef} className="calendar-now">
                      <span className="calendar-now-line" />
                      <span className="calendar-now-label">AHORA · {formatHora(now)}</span>
                      <span className="calendar-now-line" />
                    </div>
                  )}

                  {group.items.map((act, idx) => {
                    const inicio = new Date(act.inicio);
                    const fin = act.fin ? new Date(act.fin) : null;
                    const finished = fin
                      ? fin.getTime() < now.getTime()
                      : inicio.getTime() < now.getTime() - 60 * 60 * 1000;
                    const live =
                      !finished &&
                      inicio.getTime() <= now.getTime() &&
                      (fin ? fin.getTime() >= now.getTime() : true);
                    const caseta = casetaById.get(act.caseta_id);

                    // ¿Insertar la marca AHORA antes de este item?
                    const prev = group.items[idx - 1];
                    const insertNow =
                      isToday &&
                      inicio.getTime() > now.getTime() &&
                      (!prev || new Date(prev.inicio).getTime() <= now.getTime());

                    return (
                      <div key={act.id} className="calendar-item-wrap">
                        {insertNow && (
                          <div ref={nowMarkerRef} className="calendar-now">
                            <span className="calendar-now-line" />
                            <span className="calendar-now-label">
                              AHORA · {formatHora(now)}
                            </span>
                            <span className="calendar-now-line" />
                          </div>
                        )}
                        <button
                          type="button"
                          className={`calendar-item ${finished ? 'is-past' : ''} ${live ? 'is-live' : ''}`}
                          onClick={() => setDetail(act)}
                        >
                          <div className="calendar-item-time">
                            <strong>{formatHora(inicio)}</strong>
                            {fin && <span className="muted">{formatHora(fin)}</span>}
                          </div>
                          <div className="calendar-item-body">
                            <div className="calendar-item-title">{act.titulo}</div>
                            <div className="calendar-item-caseta">
                              {caseta ? (
                                <>
                                  <span className="calendar-item-num">{caseta.numero}</span>
                                  <span>{caseta.nombre}</span>
                                </>
                              ) : (
                                <span className="muted">Caseta desconocida</span>
                              )}
                            </div>
                          </div>
                          <div className="calendar-item-status">
                            {live && <span className="badge badge-live">En curso</span>}
                            {finished && <span className="badge badge-past">Finalizado</span>}
                          </div>
                        </button>
                      </div>
                    );
                  })}

                  {/* Si es hoy y todos los items son pasados, mostrar AHORA al final */}
                  {isToday &&
                    group.items.length > 0 &&
                    new Date(group.items[group.items.length - 1].inicio).getTime() <=
                      now.getTime() && (
                      <div ref={nowMarkerRef} className="calendar-now">
                        <span className="calendar-now-line" />
                        <span className="calendar-now-label">
                          AHORA · {formatHora(now)}
                        </span>
                        <span className="calendar-now-line" />
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {detail && (
        <EventDetailModal
          actuacion={detail}
          caseta={casetaById.get(detail.caseta_id)}
          onClose={() => setDetail(null)}
          onVerEnMapa={handleVerEnMapa}
        />
      )}
    </>
  );
}

function EventDetailModal({ actuacion, caseta, onClose, onVerEnMapa }) {
  const [showCartel, setShowCartel] = useState(false);
  const inicio = new Date(actuacion.inicio);
  const fin = actuacion.fin ? new Date(actuacion.fin) : null;
  const finished = fin
    ? fin.getTime() < Date.now()
    : inicio.getTime() < Date.now() - 60 * 60 * 1000;

  return (
    <>
      <div className="event-overlay" onClick={onClose} />
      <div
        className="event-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de la actuación ${actuacion.titulo}`}
      >
        <button
          type="button"
          className="event-close"
          onClick={onClose}
          aria-label="Cerrar detalle"
        >
          ×
        </button>

        {actuacion.cartel && (
          <button
            type="button"
            className="event-cartel"
            onClick={() => setShowCartel(true)}
            aria-label="Ampliar cartel"
          >
            <img src={actuacion.cartel} alt={`Cartel de ${actuacion.titulo}`} />
          </button>
        )}

        <div className="event-body">
          <h3 className="event-title">{actuacion.titulo}</h3>

          <div className="event-meta">
            <div className="event-meta-row">
              <span className="event-meta-label">Cuándo</span>
              <span>
                {formatDayLabel(inicio)} · {formatHora(inicio)}
                {fin && ` – ${formatHora(fin)}`}
              </span>
            </div>

            {caseta && (
              <div className="event-meta-row">
                <span className="event-meta-label">Dónde</span>
                <span>
                  Caseta nº {caseta.numero} · {caseta.nombre}
                </span>
              </div>
            )}

            {finished && (
              <div className="event-meta-row">
                <span className="badge badge-past">Finalizado</span>
              </div>
            )}
          </div>

          {actuacion.descripcion && (
            <p className="event-description">{actuacion.descripcion}</p>
          )}

          {caseta && (
            <button
              type="button"
              className="event-cta"
              onClick={() => onVerEnMapa?.(caseta.id)}
            >
              Ver caseta en el mapa
            </button>
          )}
        </div>
      </div>

      {showCartel && actuacion.cartel && (
        <Lightbox
          src={actuacion.cartel}
          alt={`Cartel de ${actuacion.titulo}`}
          onClose={() => setShowCartel(false)}
        />
      )}
    </>
  );
}
