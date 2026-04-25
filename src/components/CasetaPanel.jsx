import { useRef, useState } from 'react';
import Lightbox from './Lightbox.jsx';
import { flattenTags } from '../data/tagsConfig.js';

const TIPO_LABELS = {
  tradicional: 'Tradicional',
  no_tradicional: 'No tradicional',
  municipal: 'Municipal',
  servicio: 'Servicio',
};

const ACCESO_LABELS = {
  publica: 'Pública',
  privada: 'Privada',
  servicios_publicos: 'Servicios públicos',
};

function getInitials(nombre) {
  return (nombre || '')
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';
}

export default function CasetaPanel({
  caseta,
  actuaciones = [],
  expanded,
  onToggleExpanded,
  onCollapse,
  onClose,
}) {
  const dragRef = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [shareToast, setShareToast] = useState(null);
  const [tab, setTab] = useState('info');
  const [openActuacionId, setOpenActuacionId] = useState(null);

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?caseta=${caseta.id}`;
    const data = {
      title: `Caseta nº ${caseta.numero} – ${caseta.nombre}`,
      text: `🐴 ${caseta.nombre} (Caseta nº ${caseta.numero}) en la Feria de Jerez`,
      url,
    };
    const canUseShare =
      typeof navigator.share === 'function' &&
      (typeof navigator.canShare !== 'function' || navigator.canShare(data));
    if (canUseShare) {
      try {
        await navigator.share(data);
      } catch (err) {
        if (err && err.name !== 'AbortError') console.error(err);
      }
      return;
    }
    // Sin Web Share API (escritorio o contexto no seguro): copiar enlace
    try {
      await navigator.clipboard.writeText(url);
      setShareToast('Enlace copiado');
    } catch (_) {
      setShareToast('Abre desde HTTPS para compartir');
    }
    setTimeout(() => setShareToast(null), 2200);
  };

  // --- Gesto drag vertical en la barra superior ---
  const onPointerDown = (e) => {
    dragRef.current = {
      startY: e.clientY,
      startTime: Date.now(),
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dy) > 4) dragRef.current.moved = true;
    if (expanded && dy > 0) setDragOffset(dy);
    else if (!expanded && dy < 0) setDragOffset(dy);
  };

  const onPointerUp = (e) => {
    if (!dragRef.current) return;
    const dy = e.clientY - dragRef.current.startY;
    const dt = Date.now() - dragRef.current.startTime;
    const velocity = Math.abs(dy) / Math.max(dt, 1);
    const moved = dragRef.current.moved;
    dragRef.current = null;
    setDragOffset(0);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (!moved) {
      onToggleExpanded?.();
      return;
    }
    const threshold = 60;
    if (expanded && (dy > threshold || velocity > 0.5)) {
      onCollapse?.();
    } else if (!expanded && (dy < -threshold || velocity > 0.5)) {
      onToggleExpanded?.();
    }
  };

  const tipoLabel = TIPO_LABELS[caseta.tipo] || caseta.tipo;
  const tags = flattenTags(caseta.tags);

  const sheetStyle =
    dragOffset !== 0 ? { transform: `translateY(${dragOffset}px)` } : undefined;

  return (
    <>
      {expanded && <div className="panel-backdrop" onClick={onCollapse} />}
      <aside
        className={`caseta-sheet ${expanded ? 'expanded' : 'collapsed'}`}
        style={sheetStyle}
        role="dialog"
        aria-label={`Información de ${caseta.nombre}`}
      >
        <div
          className="sheet-handle-bar"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="button"
          tabIndex={0}
          aria-label={expanded ? 'Minimizar' : 'Desplegar información'}
        >
          <span className="sheet-grip" />
          <div className="sheet-handle-content">
            <span className="sheet-numero">{caseta.numero}</span>
            <span className="sheet-nombre">{caseta.nombre}</span>
          </div>
          <span className="sheet-chevron">{expanded ? '▾' : '▴'}</span>
        </div>

        {expanded && (
          <div className="sheet-body">
            <div className="panel-top-actions">
              <button
                type="button"
                className="panel-icon-btn panel-share-btn"
                onClick={handleShare}
                aria-label="Compartir esta caseta"
                title="Compartir"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                  <polyline points="7 8 12 3 17 8" />
                </svg>
              </button>
              <button
                className="panel-icon-btn panel-close"
                onClick={onClose}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div
              className="panel-photo"
              onClick={() => caseta.foto && setLightboxSrc(caseta.foto)}
              style={{ cursor: caseta.foto ? 'zoom-in' : 'default' }}
            >
              {caseta.foto ? (
                <img src={caseta.foto} alt={caseta.nombre} />
              ) : (
                <div className="panel-photo-placeholder">
                  <span>{getInitials(caseta.nombre)}</span>
                </div>
              )}
            </div>

            <div className="panel-body">
              <div className="panel-header">
                <span className="panel-numero">Nº {caseta.numero}</span>
                {caseta.tipo && (
                  <span className={`panel-tipo tipo-${caseta.tipo}`}>
                    {tipoLabel}
                  </span>
                )}
                {caseta.acceso && (
                  <span className={`panel-tipo acceso-${caseta.acceso}`}>
                    {ACCESO_LABELS[caseta.acceso] || caseta.acceso}
                  </span>
                )}
              </div>

              <h2 className="panel-nombre">{caseta.nombre}</h2>

              {tags.length > 0 && (
                <div className="panel-tags">
                  {tags.map((t) => (
                    <span
                      key={`${t.groupId}-${t.value}`}
                      className={`panel-tag panel-tag-${t.groupId}`}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="panel-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'info'}
                  className={`panel-tab ${tab === 'info' ? 'is-active' : ''}`}
                  onClick={() => setTab('info')}
                >
                  Información
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'actuaciones'}
                  className={`panel-tab ${tab === 'actuaciones' ? 'is-active' : ''}`}
                  onClick={() => setTab('actuaciones')}
                >
                  Actuaciones
                  {actuaciones.length > 0 && (
                    <span className="panel-tab-count">{actuaciones.length}</span>
                  )}
                </button>
              </div>

              {tab === 'info' && (
                <>
                  {caseta.descripcion && (
                    <p className="panel-descripcion">{caseta.descripcion}</p>
                  )}

                  {caseta.foto_menu && (
                    <div className="panel-section">
                      <h3 className="panel-section-title">Menú</h3>
                      <button
                        type="button"
                        className="panel-menu-thumb"
                        onClick={() => setLightboxSrc(caseta.foto_menu)}
                        aria-label="Ver menú en grande"
                      >
                        <img src={caseta.foto_menu} alt="Menú" />
                        <span className="panel-menu-zoom">🔍</span>
                      </button>
                    </div>
                  )}

                  {!caseta.posicion && (
                    <div className="panel-notice">
                      Ubicación pendiente de asignar en el plano.
                    </div>
                  )}
                </>
              )}

              {tab === 'actuaciones' && (
                <CasetaActuaciones
                  actuaciones={actuaciones}
                  openId={openActuacionId}
                  onToggle={(id) =>
                    setOpenActuacionId((cur) => (cur === id ? null : id))
                  }
                  onCartelClick={(url) => setLightboxSrc(url)}
                />
              )}
            </div>
          </div>
        )}
        {shareToast && <div className="panel-share-toast">{shareToast}</div>}
      </aside>

      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt={caseta.nombre}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}

function CasetaActuaciones({ actuaciones, openId, onToggle, onCartelClick }) {
  if (!actuaciones || actuaciones.length === 0) {
    return (
      <div className="panel-actuaciones-empty">
        Esta caseta aún no ha publicado actuaciones.
      </div>
    );
  }

  // Próximas primero, pasadas al final.
  const now = Date.now();
  const sorted = [...actuaciones].sort((a, b) => {
    const ta = new Date(a.inicio).getTime();
    const tb = new Date(b.inicio).getTime();
    const aPast = ta < now ? 1 : 0;
    const bPast = tb < now ? 1 : 0;
    if (aPast !== bPast) return aPast - bPast; // próximas primero
    return ta - tb;
  });

  return (
    <div className="panel-actuaciones">
      {sorted.map((act) => {
        const inicio = new Date(act.inicio);
        const fin = act.fin ? new Date(act.fin) : null;
        const finished = (fin ? fin.getTime() : inicio.getTime()) < now;
        const live =
          !finished &&
          inicio.getTime() <= now &&
          (fin ? fin.getTime() >= now : true);
        const isOpen = openId === act.id;

        const fmt = (d) =>
          d.toLocaleString('es-ES', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });

        return (
          <div
            key={act.id}
            className={`panel-actuacion ${finished ? 'is-past' : ''} ${live ? 'is-live' : ''}`}
          >
            <button
              type="button"
              className="panel-actuacion-head"
              onClick={() => onToggle?.(act.id)}
              aria-expanded={isOpen}
            >
              <div className="panel-actuacion-time">
                <strong>
                  {inicio.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
                <span className="muted">
                  {inicio.toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
              </div>
              <div className="panel-actuacion-title">{act.titulo}</div>
              <div className="panel-actuacion-status">
                {live && <span className="badge badge-live">En curso</span>}
                {finished && <span className="badge badge-past">Finalizado</span>}
                <span className="panel-actuacion-chev" aria-hidden>
                  {isOpen ? '▾' : '▸'}
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="panel-actuacion-body">
                {act.cartel && (
                  <button
                    type="button"
                    className="panel-actuacion-cartel"
                    onClick={() => onCartelClick?.(act.cartel)}
                    aria-label="Ampliar cartel"
                  >
                    <img src={act.cartel} alt={`Cartel de ${act.titulo}`} />
                  </button>
                )}
                <div className="panel-actuacion-meta">
                  <span>
                    {fmt(inicio)}
                    {fin && ` – ${fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </div>
                {act.descripcion && (
                  <p className="panel-actuacion-desc">{act.descripcion}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
