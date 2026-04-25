import { createClient } from '@supabase/supabase-js';

/*
 * Cliente Supabase para la Feria de Jerez.
 *
 * La "anon key" es pública por diseño (se inyecta en el bundle del navegador).
 * La protección real de escritura se hace con las políticas RLS definidas en
 * el panel de Supabase.
 *
 * Para rotar credenciales, basta con cambiar estos dos valores y recompilar.
 */

export const SUPABASE_URL = 'https://ntgzffqyjiaurewgqcht.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Z3pmZnF5amlhdXJld2dxY2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDM3MjksImV4cCI6MjA5MjYxOTcyOX0.BduUXMzNvgw5DHwksfTRw62O_UyLhz0cjCOHSAWSmJE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
  auth: { persistSession: false },
});

// Bucket donde guardamos las fotos de las casetas.
export const FOTOS_BUCKET = 'casetas-fotos';

/**
 * Sube una foto al bucket y devuelve la URL pública para guardarla en la
 * tabla `casetas`. Si ya había una foto previa en `oldUrl`, la elimina.
 *
 * @param {File}   file       Archivo File del input <input type="file">
 * @param {string} casetaId   ID de la caseta (para organizar carpetas)
 * @param {'cabecera'|'menu'} tipo
 * @param {string?} oldUrl    URL anterior a borrar (opcional)
 * @returns {Promise<string>} URL pública de la foto subida
 */
export async function uploadFoto(file, casetaId, tipo, oldUrl) {
  if (!file) throw new Error('No file provided');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${casetaId}/${tipo}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(FOTOS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || `image/${ext}`,
    });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(FOTOS_BUCKET).getPublicUrl(path);

  if (oldUrl) {
    deleteFoto(oldUrl).catch(() => {});
  }
  return publicUrl;
}

/**
 * Borra una foto a partir de su URL pública.
 */
export async function deleteFoto(publicUrl) {
  if (!publicUrl) return;
  const marker = `/object/public/${FOTOS_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(FOTOS_BUCKET).remove([path]);
}
