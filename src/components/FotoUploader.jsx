import { useRef, useState } from 'react';
import { uploadFoto } from '../lib/supabase.js';
import { compressImage } from '../lib/imageCompress.js';

/**
 * Componente para subir / reemplazar / borrar una foto asociada a una caseta.
 *
 * Props:
 *  - casetaId: id de la caseta (organiza el path en Storage)
 *  - tipo: 'cabecera' | 'menu' (subcarpeta en el path)
 *  - currentUrl: URL actual de la foto (para mostrar preview)
 *  - onChange(newUrl|null): callback cuando se sube o elimina
 *  - label: etiqueta visible
 */
export default function FotoUploader({
  casetaId,
  tipo,
  currentUrl,
  onChange,
  label,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadFoto(compressed, casetaId, tipo, currentUrl);
      onChange?.(url);
    } catch (err) {
      console.error('Error subiendo foto', err);
      setError(err.message || 'No se pudo subir la foto');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(`¿Quitar la foto de ${label.toLowerCase()}?`)) return;
    setError(null);
    setBusy(true);
    try {
      const { deleteFoto } = await import('../lib/supabase.js');
      await deleteFoto(currentUrl);
      onChange?.(null);
    } catch (err) {
      console.error('Error borrando foto', err);
      setError(err.message || 'No se pudo borrar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="foto-uploader">
      <span className="foto-uploader-label">{label}</span>
      {currentUrl ? (
        <div className="foto-uploader-preview">
          <img src={currentUrl} alt={label} />
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
              onClick={handleRemove}
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
          {busy ? 'Subiendo…' : '+ Añadir foto'}
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
  );
}
