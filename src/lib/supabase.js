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
