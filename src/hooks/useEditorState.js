import { useCallback, useEffect, useMemo, useState } from 'react';

/*
 * Hook del estado del editor de casetas.
 *
 * Guarda todos los cambios que haces (posición, forma, tamaño, nombre,
 * descripción, acceso público/privado, etc.) en localStorage, de forma
 * automática. Al recargar la web los cambios siguen ahí.
 *
 * El modelo es un diccionario de "overrides" (cambios por id de caseta):
 *   overrides = {
 *     12: {
 *       posicion: { x: 325, y: 480 },
 *       forma: "rect",
 *       tamano: { ancho: 24, alto: 16 },
 *       acceso: "publica",
 *       descripcion: "...",
 *     },
 *     ...
 *   }
 *
 * Al combinar con las casetas originales del JSON obtenemos la versión final.
 */

const STORAGE_KEY = 'feria-jerez-editor-v1';

function loadFromStorage() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function saveToStorage(data) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {
    // Silenciar. En algunos navegadores (privado) localStorage falla.
  }
}

export function useEditorState(casetasOriginal) {
  const [overrides, setOverrides] = useState(() => loadFromStorage());

  // Persistir automáticamente en cada cambio
  useEffect(() => {
    saveToStorage(overrides);
  }, [overrides]);

  // Fusión casetas originales + overrides = casetas finales visibles
  const casetas = useMemo(() => {
    return casetasOriginal.map((c) => {
      const o = overrides[c.id];
      if (!o) return c;
      return { ...c, ...o };
    });
  }, [casetasOriginal, overrides]);

  const updateCaseta = useCallback((id, patch) => {
    setOverrides((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  }, []);

  const resetCaseta = useCallback((id) => {
    setOverrides((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const resetAll = useCallback(() => {
    setOverrides({});
  }, []);

  const casetasCount = casetasOriginal.length;
  const placed = useMemo(
    () => casetas.filter((c) => c.posicion).length,
    [casetas],
  );

  return {
    overrides,
    casetas,
    updateCaseta,
    resetCaseta,
    resetAll,
    stats: { total: casetasCount, placed, pending: casetasCount - placed },
  };
}
