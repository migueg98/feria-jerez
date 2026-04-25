import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';

/*
 * Sincroniza las casetas con Supabase (base de datos remota).
 *
 *  - Al cargar, pide la lista desde la tabla "casetas". Si la tabla está vacía
 *    la siembra con "seed" (el JSON inicial del repo).
 *  - Se suscribe a realtime: cualquier cambio hecho desde otro dispositivo
 *    aparece al instante.
 *  - updateCaseta hace actualización optimista (se ve al momento en UI) y
 *    envía el cambio a Supabase en segundo plano.
 *
 * Estados:
 *   - "loading": cargando la primera vez
 *   - "ready":   sincronizado
 *   - "saving":  enviando un cambio
 *   - "error":   último envío falló
 *   - "offline": sin conexión (fallback)
 */

const COLUMNS =
  'id,numero,nombre,tipo,descripcion,musica,foto,foto_menu,tags,acceso,posicion,forma,tamano,locked';

function toRow(c) {
  return {
    id: c.id,
    numero: c.numero ?? null,
    nombre: c.nombre ?? null,
    tipo: c.tipo ?? null,
    descripcion: c.descripcion ?? null,
    musica: c.musica ?? null,
    foto: c.foto ?? null,
    foto_menu: c.foto_menu ?? null,
    tags: c.tags ?? null,
    acceso: c.acceso ?? null,
    posicion: c.posicion ?? null,
    forma: c.forma ?? null,
    tamano: c.tamano ?? null,
    locked: c.locked ?? false,
  };
}

export function useCasetasSync(seed) {
  const [casetas, setCasetas] = useState(seed);
  const [status, setStatus] = useState('loading');
  const [lastError, setLastError] = useState(null);
  const pendingWritesRef = useRef(0);

  // Carga inicial + sembrado si tabla vacía
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus('loading');
      const { data, error } = await supabase
        .from('casetas')
        .select(COLUMNS)
        .order('id');

      if (cancelled) return;

      if (error) {
        console.error('Error leyendo casetas:', error);
        setLastError(error.message);
        setStatus('error');
        return;
      }

      if (!data || data.length === 0) {
        // Sembrado inicial
        const payload = seed.map(toRow);
        const { error: seedError } = await supabase
          .from('casetas')
          .insert(payload);
        if (cancelled) return;
        if (seedError) {
          console.error('Error sembrando casetas:', seedError);
          setLastError(seedError.message);
          setStatus('error');
          return;
        }
        setCasetas(seed);
      } else {
        // Merge con el seed para conservar los campos que puedan faltar en BD
        // (por si se añade más adelante algún campo nuevo al JSON)
        const byId = new Map(data.map((d) => [d.id, d]));
        const merged = seed.map((c) => {
          const row = byId.get(c.id);
          return row ? { ...c, ...row } : c;
        });
        setCasetas(merged);
      }
      setStatus('ready');
    }

    init();

    // Suscripción realtime: propaga cambios de otros dispositivos.
    const channel = supabase
      .channel('casetas-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'casetas' },
        (payload) => {
          setCasetas((prev) =>
            prev.map((c) =>
              c.id === payload.new.id ? { ...c, ...payload.new } : c,
            ),
          );
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'casetas' },
        (payload) => {
          setCasetas((prev) => {
            if (prev.some((c) => c.id === payload.new.id)) return prev;
            return [...prev, payload.new].sort((a, b) => a.id - b.id);
          });
        },
      )
      .subscribe();

    // Detectar cambio de online/offline para mostrarlo en UI
    const onOnline = () => setStatus((s) => (s === 'offline' ? 'ready' : s));
    const onOffline = () => setStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    if (!navigator.onLine) setStatus('offline');

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [seed]);

  // Update optimista + envío a Supabase
  const updateCaseta = useCallback((id, patch) => {
    // Siempre actualizamos el estado local al momento
    setCasetas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );

    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }

    pendingWritesRef.current += 1;
    setStatus('saving');

    supabase
      .from('casetas')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .then(({ error }) => {
        pendingWritesRef.current -= 1;
        if (error) {
          console.error('Error actualizando caseta', id, error);
          setLastError(error.message);
          setStatus('error');
          return;
        }
        if (pendingWritesRef.current <= 0) {
          pendingWritesRef.current = 0;
          setStatus('ready');
        }
      });
  }, []);

  // Reset de los cambios de una caseta: vuelve a los datos del seed
  const resetCaseta = useCallback(
    (id) => {
      const original = seed.find((c) => c.id === id);
      if (!original) return;
      updateCaseta(id, toRow(original));
    },
    [seed, updateCaseta],
  );

  const stats = {
    total: casetas.length,
    placed: casetas.filter((c) => c.posicion).length,
    pending: casetas.filter((c) => !c.posicion).length,
  };

  return {
    casetas,
    status,
    lastError,
    updateCaseta,
    resetCaseta,
    stats,
  };
}
