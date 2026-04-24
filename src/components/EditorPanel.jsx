import { useMemo, useState } from 'react';

const TIPOS = [
  { value: 'tradicional', label: 'Tradicional' },
  { value: 'no_tradicional', label: 'No tradicional' },
  { value: 'municipal', label: 'Municipal' },
  { value: 'servicio', label: 'Servicio' },
];

const ACCESOS = [
  { value: 'publica', label: 'Pública (acceso libre)' },
  { value: 'privada', label: 'Privada (solo socios/invitados)' },
];

const FORMAS = [
  { value: 'rect', label: 'Rectángulo' },
  { value: 'circulo', label: 'Círculo' },
];

function CasetaForm({ caseta, onFieldChange }) {
  if (!caseta) return null;

  const forma = caseta.forma || 'rect';
  const tamano = caseta.tamano || (forma === 'circulo' ? { radio: 10 } : { ancho: 24, alto: 16 });

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

      <div className="form-row">
        <label className="form-field">
          <span>Tipo</span>
          <select
            value={caseta.tipo || 'tradicional'}
            onChange={(e) => onFieldChange(caseta.id, 'tipo', e.target.value)}
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Acceso</span>
          <select
            value={caseta.acceso || 'publica'}
            onChange={(e) => onFieldChange(caseta.id, 'acceso', e.target.value)}
          >
            {ACCESOS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="form-field">
        <span>Descripción</span>
        <textarea
          rows={2}
          value={caseta.descripcion || ''}
          onChange={(e) => onFieldChange(caseta.id, 'descripcion', e.target.value)}
          placeholder="Breve descripción de la caseta…"
        />
      </label>

      <label className="form-field">
        <span>Música</span>
        <input
          type="text"
          value={caseta.musica || ''}
          onChange={(e) => onFieldChange(caseta.id, 'musica', e.target.value)}
          placeholder="p. ej. Flamenco, Rumba…"
        />
      </label>

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
    </div>
  );
}

export default function EditorPanel({
  casetas,
  selectedCaseta,
  onSelectCasetaId,
  onClose,
  onFieldChange,
  onToggleLock,
  onResetSelected,
  onResetAll,
  onDownload,
  stats,
  lastAssigned,
}) {
  const [filterText, setFilterText] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(false);

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

  return (
    <aside className="editor-panel">
      <div className="editor-header">
        <strong>MODO EDITOR</strong>
        <span className="editor-progress">
          {stats.placed} / {stats.total} · {stats.pending} pend.
        </span>
      </div>

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
                  onClick={() => onSelectCasetaId(c.id)}
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

      <div className="editor-actions">
        <button type="button" onClick={onDownload} className="btn btn-primary">
          💾 Descargar JSON
        </button>
        <button type="button" onClick={onResetAll} className="btn btn-danger">
          Reset todo
        </button>
      </div>

      <div className="editor-note">
        Tus cambios se guardan automáticamente en este navegador. Para
        publicarlos, pulsa <strong>Descargar JSON</strong> y reemplaza{' '}
        <code>src/data/casetas.json</code>.
      </div>
    </aside>
  );
}
