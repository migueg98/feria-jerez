import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';

/*
 * Sincroniza la tabla `actuaciones` con Supabase (realtime + CRUD).
 * Espejo del hook de casetas, pero con add/delete además del update.
 *
 * Cada actuación: {
 *   id (uuid), caseta_id (number),
 *   titulo (text), descripcion (text|null),
 *   inicio (ISO datetime), fin (ISO datetime|null),
 *   cartel (URL|null), created_at, updated_at
 * }
 */

const COLUMNS =
  'id,caseta_id,titulo,descripcion,inicio,fin,cartel,created_at,updated_at';

export function useActuacionesSync() {
  const [actuaciones, setActuaciones] = useState([]);
  const [status, setStatus] = useState('loading');
  const [lastError, setLastError] = useState(null);
  const pendingRef = useRef(0);

  // Carga inicial + realtime
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus('loading');
      const { data, error } = await supabase
        .from('actuaciones')
        .select(COLUMNS)
        .order('inicio', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Error leyendo actuaciones:', error);
        setLastError(error.message);
        setStatus('error');
        return;
      }
      setActuaciones(data || []);
      setStatus('ready');
    }
    init();

    const channel = supabase
      .channel('actuaciones-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'actuaciones' },
        (payload) => {
          setActuaciones((prev) => {
            if (payload.eventType === 'INSERT') {
              if (prev.some((a) => a.id === payload.new.id)) return prev;
              return [...prev, payload.new].sort((a, b) =>
                a.inicio.localeCompare(b.inicio),
              );
            }
            if (payload.eventType === 'UPDATE') {
              return prev
                .map((a) => (a.id === payload.new.id ? { ...a, ...payload.new } : a))
                .sort((a, b) => a.inicio.localeCompare(b.inicio));
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((a) => a.id !== payload.old.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const beginWrite = () => {
    pendingRef.current += 1;
    setStatus('saving');
  };
  const endWrite = (error) => {
    pendingRef.current -= 1;
    if (error) {
      setLastError(error.message || String(error));
      setStatus('error');
      return;
    }
    if (pendingRef.current <= 0) {
      pendingRef.current = 0;
      setStatus('ready');
    }
  };

  const addActuacion = useCallback(async (input) => {
    const row = {
      caseta_id: input.caseta_id,
      titulo: input.titulo,
      descripcion: input.descripcion ?? null,
      inicio: input.inicio,
      fin: input.fin ?? null,
      cartel: input.cartel ?? null,
    };
    // Si el cliente ya generó el id (por ej. para asociar el path del cartel
    // antes de insertar), lo respetamos.
    if (input.id) row.id = input.id;
    beginWrite();
    const { data, error } = await supabase
      .from('actuaciones')
      .insert(row)
      .select(COLUMNS)
      .single();
    endWrite(error);
    if (error) return null;
    // Optimista por si el realtime tarda un tick
    setActuaciones((prev) =>
      prev.some((a) => a.id === data.id)
        ? prev
        : [...prev, data].sort((a, b) => a.inicio.localeCompare(b.inicio)),
    );
    return data;
  }, []);

  const updateActuacion = useCallback(async (id, patch) => {
    setActuaciones((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
    beginWrite();
    const { error } = await supabase
      .from('actuaciones')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);
    endWrite(error);
  }, []);

  const deleteActuacion = useCallback(async (id) => {
    setActuaciones((prev) => prev.filter((a) => a.id !== id));
    beginWrite();
    const { error } = await supabase.from('actuaciones').delete().eq('id', id);
    endWrite(error);
  }, []);

  return {
    actuaciones,
    status,
    lastError,
    addActuacion,
    updateActuacion,
    deleteActuacion,
  };
}
