import { useEffect } from 'react';

/**
 * Visor a pantalla completa para ver una imagen en grande.
 * Cierra al hacer click, pulsar Escape o tocar el botón ×.
 */
export default function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="lightbox"
      onClick={onClose}
      role="dialog"
      aria-label="Imagen ampliada"
    >
      <button
        type="button"
        className="lightbox-close"
        onClick={onClose}
        aria-label="Cerrar"
      >
        ×
      </button>
      <img
        src={src}
        alt={alt || ''}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
