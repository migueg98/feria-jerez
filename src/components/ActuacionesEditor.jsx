import { useMemo, useRef, useState } from 'react';
import { uploadCartel, deleteFoto } from '../lib/supabase.js';
import { compressImage } from '../lib/imageCompress.js';

/**
 * Editor de actuaciones de UNA caseta.
 *  - Lista las actuaciones (próximas primero, pasadas atenuadas al final).
 *  - Form inline para crear nueva.
 *  - Edición / borrado por item.
 */

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  // <input type="datetime-local"> usa formato YYYY-MM-DDTHH:mm sin zona.
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function fromLocalInput(local) {
  if (!local) return null;
  // El navegador devuelve hora local; new Date() la interpreta como local.
  return new Date(local).toISOString();
}

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ActuacionesEditor({
  casetaId,
  actuaciones,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const list = useMemo(() => {
    return [...actuaciones]
      .filter((a) => a.caseta_id === casetaId)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [actuaciones, casetaId]);

  const [editingId, setEditingId] = useState(null); // id existente o 'new'
  const [draft, setDraft] = useState(null);

  const startNew = () => {
    setEditingId('new');
    setDraft({
      _newId: genId(), // para el path del cartel
      caseta_id: casetaId,
      titulo: '',
      descripcion: '',
      inicio: '',
      fin: '',
      cartel: null,
    });
  };

  const startEdit = (act) => {
    setEditingId(act.id);
    setDraft({
      ...act,
      inicio: toLocalInputValue(act.inicio),
      fin: toLocalInputValue(act.fin),
    });
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(null);
  };

  const save = async () => {
    if (!draft?.titulo?.trim()) {
      // eslint-disable-next-line no-alert
      alert('Pon al menos un título o nombre del artista.');
      return;
    }
    if (!draft.inicio) {
      // eslint-disable-next-line no-alert
      alert('Falta la hora de inicio.');
      return;
    }
    const payload = {
      caseta_id: casetaId,
      titulo: draft.titulo.trim(),
      descripcion: draft.descripcion?.trim() || null,
      inicio: fromLocalInput(draft.inicio),
      fin: draft.fin ? fromLocalInput(draft.fin) : null,
      cartel: draft.cartel || null,
    };
    if (editingId === 'new') {
      // Insert: usamos el id generado para que coincida con el path del cartel
      await onAdd({ id: draft._newId, ...payload });
    } else {
      await onUpdate(editingId, payload);
    }
    cancel();
  };

  const remove = async (act) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`¿Borrar la actuación "${act.titulo}"?`)) return;
    if (act.cartel) {
      try {
        await deleteFoto(act.cartel);
      } catch (_) {}
    }
    await onDelete(act.id);
    if (editingId === act.id) cancel();
  };

  return (
    <div className="actuaciones-editor">
      <div className="actuaciones-editor-head">
        <span className="tags-group-label">Actuaciones</span>
        {editingId === null && (
          <button type="button" className="btn btn-secondary btn-small" onClick={startNew}>
            + Nueva
          </button>
        )}
      </div>

      {list.length === 0 && editingId === null && (
        <div className="actuaciones-empty">Sin actuaciones publicadas.</div>
      )}

      <ul className="actuaciones-list">
        {list.map((act) => {
          const inicio = new Date(act.inicio);
          const past =
            (act.fin ? new Date(act.fin).getTime() : inicio.getTime()) <
            Date.now();
          if (editingId === act.id) {
            return (
              <li key={act.id} className="actuaciones-item is-editing">
                <ActuacionForm
                  draft={draft}
                  setDraft={setDraft}
                  onSave={save}
                  onCancel={cancel}
                />
              </li>
            );
          }
          return (
            <li
              key={act.id}
              className={`actuaciones-item ${past ? 'is-past' : ''}`}
            >
              <div className="actuaciones-item-info">
                <span className="actuaciones-item-time">
                  {inicio.toLocaleString('es-ES', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="actuaciones-item-title">{act.titulo}</span>
                {past && <span className="badge badge-past">Finalizado</span>}
              </div>
              <div className="actuaciones-item-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => startEdit(act)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small btn-danger"
                  onClick={() => remove(act)}
                >
                  Borrar
                </button>
              </div>
            </li>
          );
        })}

        {editingId === 'new' && (
          <li className="actuaciones-item is-editing">
            <ActuacionForm
              draft={draft}
              setDraft={setDraft}
              onSave={save}
              onCancel={cancel}
            />
          </li>
        )}
      </ul>
    </div>
  );
}

function ActuacionForm({ draft, setDraft, onSave, onCancel }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const compressed = await compressImage(file);
      const id = draft.id || draft._newId;
      const url = await uploadCartel(compressed, id, draft.cartel);
      set('cartel', url);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo subir el cartel');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeCartel = async () => {
    if (!draft.cartel) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('¿Quitar el cartel?')) return;
    try {
      await deleteFoto(draft.cartel);
    } catch (_) {}
    set('cartel', null);
  };

  return (
    <div className="actuacion-form">
      <label className="form-field">
        <span>Título / artista</span>
        <input
          type="text"
          value={draft.titulo}
          onChange={(e) => set('titulo', e.target.value)}
          placeholder="Ej. María del Mar Moreno"
        />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Inicio</span>
          <input
            type="datetime-local"
            value={draft.inicio}
            onChange={(e) => set('inicio', e.target.value)}
          />
        </label>
        <label className="form-field">
          <span>Fin (opcional)</span>
          <input
            type="datetime-local"
            value={draft.fin || ''}
            onChange={(e) => set('fin', e.target.value)}
          />
        </label>
      </div>

      <label className="form-field">
        <span>Descripción</span>
        <textarea
          rows={2}
          value={draft.descripcion || ''}
          onChange={(e) => set('descripcion', e.target.value)}
          placeholder="Estilo, repertorio, observaciones…"
        />
      </label>

      <div className="foto-uploader">
        <span className="foto-uploader-label">Cartel (opcional)</span>
        {draft.cartel ? (
          <div className="foto-uploader-preview">
            <img src={draft.cartel} alt="Cartel" />
            <div className="foto-uploader-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                Cambiar
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={removeCartel}
                disabled={busy}
              >
                Quitar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="foto-uploader-empty"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? 'Subiendo…' : '+ Añadir cartel'}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        {error && <div className="foto-uploader-error">{error}</div>}
      </div>

      <div className="actuacion-form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary" onClick={onSave} disabled={busy}>
          Guardar
        </button>
      </div>
    </div>
  );
}
