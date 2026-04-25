import { useMemo, useRef, useState } from 'react';
import FotoUploader from './FotoUploader.jsx';
import { TAG_GROUPS, normalizeComidaValue } from '../data/tagsConfig.js';

const FORMAS = [
  { value: 'rect', label: 'Rectángulo' },
  { value: 'circulo', label: 'Círculo' },
];

const ACCESOS = [
  { value: 'publica', label: 'Pública', cls: 'tag-chip-acceso--publica' },
  { value: 'privada', label: 'Privada', cls: 'tag-chip-acceso--privada' },
  { value: 'servicios_publicos', label: 'Servicios públicos', cls: 'tag-chip-acceso--servicios' },
];

function AccesoEditor({ caseta, onFieldChange }) {
  const current = caseta.acceso || null;
  return (
    <div className="tags-editor">
      <div className="tags-group">
        <span className="tags-group-label">Acceso</span>
        <div className="tags-group-options">
          {ACCESOS.map((opt) => {
            const selected = current === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`tag-chip tag-chip-acceso ${opt.cls} ${selected ? 'selected' : ''}`}
                onClick={() =>
                  onFieldChange(caseta.id, 'acceso', selected ? null : opt.value)
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TagsEditor({ caseta, onFieldChange }) {
  const tags = caseta.tags || {};

  const setTag = (groupId, value) => {
    const next = { ...tags, [groupId]: value };
    onFieldChange(caseta.id, 'tags', next);
  };

  const toggleMulti = (groupId, value) => {
    const arr = Array.isArray(tags[groupId]) ? tags[groupId] : [];
    const exists = arr.includes(value);
    const next = exists ? arr.filter((v) => v !== value) : [...arr, value];
    onFieldChange(caseta.id, 'tags', { ...tags, [groupId]: next });
  };

  return (
    <div className="tags-editor">
      {TAG_GROUPS.map((group) => (
        <div key={group.id} className="tags-group">
          <span className="tags-group-label">{group.label}</span>
          <div className="tags-group-options">
            {group.options.map((opt) => {
              const selected = group.multi
                ? Array.isArray(tags[group.id]) && tags[group.id].includes(opt.value)
                : group.id === 'comida'
                  ? normalizeComidaValue(tags[group.id]) === opt.value
                  : tags[group.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`tag-chip ${selected ? 'selected' : ''}`}
                  onClick={() =>
                    group.multi
                      ? toggleMulti(group.id, opt.value)
                      : setTag(group.id, selected ? null : opt.value)
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CasetaForm({ caseta, onFieldChange }) {
  if (!caseta) return null;

  const forma = caseta.forma || 'rect';
  const tamano = caseta.tamano || (forma === 'circulo' ? { radio: 10 } : { ancho: 24, alto: 16 });
  const locked = Boolean(caseta.locked);

  return (
    <div className="caseta-form">
      <label className="form-field">
        <span>Nombre</span>
        <input
          type="text"
          value={caseta.nombre || ''}
          onChange={(e) => onFieldChange(caseta.id, 'nombre', e.target.value)}
        />
      </label>

      <label className="form-field">
        <span>Descripción</span>
        <textarea
          rows={2}
          value={caseta.descripcion || ''}
          onChange={(e) => onFieldChange(caseta.id, 'descripcion', e.target.value)}
          placeholder="Breve descripción de la caseta…"
        />
      </label>

      <FotoUploader
        casetaId={caseta.id}
        tipo="cabecera"
        currentUrl={caseta.foto}
        label="Foto de cabecera"
        onChange={(url) => onFieldChange(caseta.id, 'foto', url)}
      />

      <FotoUploader
        casetaId={caseta.id}
        tipo="menu"
        currentUrl={caseta.foto_menu}
        label="Foto del menú"
        onChange={(url) => onFieldChange(caseta.id, 'foto_menu', url)}
      />

      <AccesoEditor caseta={caseta} onFieldChange={onFieldChange} />

      <TagsEditor caseta={caseta} onFieldChange={onFieldChange} />

      {locked && (
        <div className="form-locked-note">
          🔒 Forma, tamaño y posición bloqueados. Desbloquea la ubicación
          arriba para modificarlos.
        </div>
      )}

      <fieldset
        className={`form-shape ${locked ? 'is-locked' : ''}`}
        disabled={locked}
      >
        <div className="form-row">
          <label className="form-field">
            <span>Forma</span>
            <select
              value={forma}
              onChange={(e) => onFieldChange(caseta.id, 'forma', e.target.value)}
            >
              {FORMAS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </label>

          {forma === 'rect' ? (
            <>
              <label className="form-field form-field-sm">
                <span>Ancho</span>
                <input
                  type="number"
                  min={6}
                  max={400}
                  value={tamano.ancho ?? 24}
                  onChange={(e) =>
                    onFieldChange(caseta.id, 'tamano', {
                      ...tamano,
                      ancho: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="form-field form-field-sm">
                <span>Alto</span>
                <input
                  type="number"
                  min={6}
                  max={400}
                  value={tamano.alto ?? 16}
                  onChange={(e) =>
                    onFieldChange(caseta.id, 'tamano', {
                      ...tamano,
                      alto: Number(e.target.value),
                    })
                  }
                />
              </label>
            </>
          ) : (
            <label className="form-field form-field-sm">
              <span>Radio</span>
              <input
                type="number"
                min={4}
                max={200}
                value={tamano.radio ?? 10}
                onChange={(e) =>
                  onFieldChange(caseta.id, 'tamano', {
                    radio: Number(e.target.value),
                  })
                }
              />
            </label>
          )}
        </div>

        {caseta.posicion && (
          <div className="form-row">
            <label className="form-field form-field-sm">
              <span>X</span>
              <input
                type="number"
                value={caseta.posicion.x}
                onChange={(e) =>
                  onFieldChange(caseta.id, 'posicion', {
                    ...caseta.posicion,
                    x: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="form-field form-field-sm">
              <span>Y</span>
              <input
                type="number"
                value={caseta.posicion.y}
                onChange={(e) =>
                  onFieldChange(caseta.id, 'posicion', {
                    ...caseta.posicion,
                    y: Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
        )}
      </fieldset>
    </div>
  );
}

const SYNC_LABELS = {
  loading: { text: 'Cargando…', cls: 'sync-loading' },
  ready: { text: '✓ Sincronizado', cls: 'sync-ready' },
  saving: { text: '⟳ Guardando…', cls: 'sync-saving' },
  error: { text: '⚠ Error al guardar', cls: 'sync-error' },
  offline: { text: '⚡ Sin conexión', cls: 'sync-offline' },
};

export default function EditorPanel({
  casetas,
  selectedCaseta,
  onSelectCasetaId,
  onClose,
  onFieldChange,
  onToggleLock,
  onResetSelected,
  stats,
  lastAssigned,
  syncStatus,
  isNarrow = false,
  sheetExpanded = true,
  onSheetExpandedChange,
}) {
  const sheetDragRef = useRef(null);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);

  const [filterText, setFilterText] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  // En móvil queremos poder colapsar la lista de casetas para tener más
  // espacio para el formulario de edición. Por defecto colapsada en móvil
  // si hay caseta seleccionada.
  const [listOpen, setListOpen] = useState(false);

  const visibleCasetas = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return casetas.filter((c) => {
      if (showOnlyPending && c.posicion) return false;
      if (!q) return true;
      return (
        c.nombre.toLowerCase().includes(q) ||
        String(c.numero).toLowerCase().includes(q)
      );
    });
  }, [casetas, filterText, showOnlyPending]);

  const selected = selectedCaseta;
  const isPlaced = Boolean(selected?.posicion);
  const isLocked = Boolean(selected?.locked);
  const sync = SYNC_LABELS[syncStatus] || SYNC_LABELS.ready;

  const setExpanded = (v) => onSheetExpandedChange?.(v);

  const onSheetPointerDown = (e) => {
    if (!isNarrow) return;
    sheetDragRef.current = { startY: e.clientY, startTime: Date.now(), moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const onSheetPointerMove = (e) => {
    if (!sheetDragRef.current) return;
    const dy = e.clientY - sheetDragRef.current.startY;
    if (Math.abs(dy) > 4) sheetDragRef.current.moved = true;
    if (sheetExpanded && dy > 0) {
      setSheetDragOffset(dy);
    } else if (!sheetExpanded && dy < 0) {
      setSheetDragOffset(dy);
    }
  };

  const onSheetPointerUp = (e) => {
    if (!sheetDragRef.current) return;
    const { startY, startTime, moved } = sheetDragRef.current;
    const dy = e.clientY - startY;
    const dt = Date.now() - startTime;
    const velocity = Math.abs(dy) / Math.max(dt, 1);
    sheetDragRef.current = null;
    setSheetDragOffset(0);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (!moved) {
      setExpanded(!sheetExpanded);
      return;
    }
    const threshold = 56;
    if (sheetExpanded && (dy > threshold || velocity > 0.45)) {
      setExpanded(false);
    } else if (!sheetExpanded && (dy < -threshold || velocity > 0.45)) {
      setExpanded(true);
    }
  };

  const showBody = !isNarrow || sheetExpanded;
  const panelClass =
    isNarrow
      ? `editor-panel editor-panel--mobile-sheet ${sheetExpanded ? 'editor-panel--sheet-open' : 'editor-panel--sheet-collapsed'}`
      : 'editor-panel';

  const sheetStyle =
    isNarrow && sheetDragOffset
      ? { transform: `translateY(${sheetDragOffset}px)` }
      : undefined;

  return (
    <aside className={panelClass} style={sheetStyle}>
      {isNarrow && (
        <div
          className="editor-mobile-handle"
          onPointerDown={onSheetPointerDown}
          onPointerMove={onSheetPointerMove}
          onPointerUp={onSheetPointerUp}
          onPointerCancel={onSheetPointerUp}
          role="button"
          tabIndex={0}
          aria-expanded={sheetExpanded}
          aria-label={sheetExpanded ? 'Contraer panel del editor' : 'Desplegar panel del editor'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded(!sheetExpanded);
            }
          }}
        >
          <span className="editor-mobile-grip" aria-hidden />
          <div className="editor-mobile-handle-content">
            {sheetExpanded ? (
              <span className="editor-mobile-hint">
                Desliza abajo o pulsa ▾ — más mapa
              </span>
            ) : (
              <>
                <div className="editor-mobile-header-row">
                  <strong>Modo editor</strong>
                  <span className="editor-mobile-stats-brief" title={sync.text}>
                    {stats.placed}/{stats.total} · {stats.pending} p.
                  </span>
                </div>
                {selected ? (
                  <div className="editor-mobile-caseta-line">
                    <span className="editor-current-num">{selected.numero}</span>
                    <span className="editor-mobile-caseta-name">{selected.nombre}</span>
                  </div>
                ) : (
                  <span className="editor-mobile-caseta-line muted">
                    Toca para abrir y editar
                  </span>
                )}
              </>
            )}
          </div>
          <span className="editor-mobile-chevron" aria-hidden>
            {sheetExpanded ? '▾' : '▴'}
          </span>
        </div>
      )}

      {showBody && (
        <>
      <div className="editor-header">
        <strong>MODO EDITOR</strong>
        <span className="editor-progress">
          {stats.placed} / {stats.total} · {stats.pending} pend.
        </span>
      </div>
      <div className={`editor-sync ${sync.cls}`}>{sync.text}</div>

      {/* Zona scrollable: edición + lista. El header y los botones de abajo
          se quedan fijos. */}
      <div className="editor-scroll">
        {selected ? (
          <>
            <div className="editor-current">
              <button
                type="button"
                className="editor-close"
                onClick={onClose}
                aria-label="Cerrar edición"
                title="Cerrar"
              >
                ×
              </button>
              <div className="editor-current-name">
                <span className="editor-current-num">{selected.numero}</span>
                <span>{selected.nombre}</span>
              </div>
              {!isPlaced ? (
                <div className="editor-tip">
                  ☞ Haz click en el plano para colocarla
                </div>
              ) : isLocked ? (
                <div className="editor-tip editor-tip-locked">
                  🔒 Ubicación bloqueada · desbloquéala para moverla
                </div>
              ) : (
                <div className="editor-tip editor-tip-ok">
                  ✓ Colocada · arrastra en el plano o usa las esquinas para
                  redimensionar
                </div>
              )}
              {lastAssigned && (
                <div className="editor-last">
                  Última asignada: <strong>{lastAssigned.numero}</strong> en (
                  {lastAssigned.x}, {lastAssigned.y})
                </div>
              )}
            </div>

            {isPlaced && (
              <CasetaForm caseta={selected} onFieldChange={onFieldChange} />
            )}

            {isPlaced && (
              <div className="editor-row-actions">
                <button
                  type="button"
                  className={`btn ${isLocked ? 'btn-unlock' : 'btn-lock'}`}
                  onClick={onToggleLock}
                >
                  {isLocked ? '🔓 Desbloquear ubicación' : '🔒 Bloquear ubicación y siguiente'}
                </button>
              </div>
            )}

            <div className="editor-row-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onResetSelected}
                disabled={!isPlaced && selected?.nombre === undefined}
              >
                Quitar cambios de esta caseta
              </button>
            </div>
          </>
        ) : (
          <div className="editor-current editor-current-empty">
            Selecciona una caseta de la lista para empezar.
          </div>
        )}

        {/* Lista de casetas: colapsable para liberar espacio */}
        <button
          type="button"
          className="editor-list-toggle"
          onClick={() => setListOpen((v) => !v)}
          aria-expanded={listOpen}
        >
          <span>{listOpen ? '▾' : '▸'} Casetas ({visibleCasetas.length})</span>
        </button>

        {listOpen && (
          <>
            <div className="editor-controls">
              <input
                type="search"
                placeholder="Filtrar por nombre o número…"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="editor-filter"
              />
              <label className="editor-check">
                <input
                  type="checkbox"
                  checked={showOnlyPending}
                  onChange={(e) => setShowOnlyPending(e.target.checked)}
                />
                Solo pendientes
              </label>
            </div>

            <ul className="editor-list">
              {visibleCasetas.length === 0 ? (
                <li className="editor-empty">Sin resultados</li>
              ) : (
                visibleCasetas.map((c) => {
                  const isSel = c.id === selected?.id;
                  const done = Boolean(c.posicion);
                  const locked = Boolean(c.locked);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`editor-item ${isSel ? 'active' : ''} ${done ? 'done' : ''}`}
                        onClick={() => {
                          onSelectCasetaId(c.id);
                          // Al pulsar, en móvil cerramos la lista para ver la edición
                          if (window.matchMedia('(max-width: 767px)').matches) {
                            setListOpen(false);
                          }
                        }}
                      >
                        <span className="editor-item-num">{c.numero}</span>
                        <span className="editor-item-name">{c.nombre}</span>
                        {locked && <span className="editor-item-check" title="Bloqueada">🔒</span>}
                        {done && !locked && <span className="editor-item-check" title="Colocada">✓</span>}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </>
        )}
      </div>
        </>
      )}
    </aside>
  );
}
