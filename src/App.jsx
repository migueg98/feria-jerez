import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView.jsx';
import SearchBar from './components/SearchBar.jsx';
import CasetaPanel from './components/CasetaPanel.jsx';
import EditorPanel from './components/EditorPanel.jsx';
import casetasSeed from './data/casetas.json';
import { useCasetasSync } from './hooks/useCasetasSync.js';

function normalize(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Valores por defecto cuando una caseta no los tiene definidos
const DEFAULT_FORMA = 'rect';
const DEFAULT_TAMANO_RECT = { ancho: 24, alto: 16 };
const DEFAULT_TAMANO_CIRC = { radio: 10 };

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [editorSelectedId, setEditorSelectedId] = useState(null);
  const [lastAssigned, setLastAssigned] = useState(null);

  // Sincronización con Supabase (lectura + realtime + writes optimistas)
  const { casetas, status, updateCaseta, resetCaseta, stats } =
    useCasetasSync(casetasSeed);

  // Modo editor: ?editor=1 en la URL
  const editorMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('editor') === '1';
  }, []);

  const filteredCasetas = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return casetas;
    return casetas.filter((c) => {
      return (
        normalize(c.nombre).includes(q) ||
        normalize(c.numero).includes(q) ||
        normalize(c.tipo).includes(q)
      );
    });
  }, [query, casetas]);

  const selectedCaseta = useMemo(
    () => casetas.find((c) => c.id === selectedId) || null,
    [selectedId, casetas],
  );

  const editorSelectedCaseta = useMemo(
    () => casetas.find((c) => c.id === editorSelectedId) || null,
    [editorSelectedId, casetas],
  );

  // Siguiente caseta pendiente (sin posición)
  const nextPendingCasetaId = useCallback(
    (afterId) => {
      const list = casetas;
      const idx = list.findIndex((c) => c.id === afterId);
      const rest = [...list.slice(idx + 1), ...list.slice(0, idx + 1)];
      const next = rest.find((c) => !c.posicion && c.id !== afterId);
      return next?.id ?? null;
    },
    [casetas],
  );

  // Click en zona vacía del plano (modo editor): asigna posición.
  const handleEditorClick = useCallback(
    (x, y) => {
      if (!editorSelectedId) {
        const snippet = `"posicion": { "x": ${x}, "y": ${y} }`;
        try {
          navigator.clipboard?.writeText(snippet);
        } catch (_) {}
        // eslint-disable-next-line no-alert
        alert(`Sin caseta seleccionada.\nCoordenadas copiadas:\n\n${snippet}`);
        return;
      }
      const current = casetas.find((c) => c.id === editorSelectedId);
      // Si está bloqueada, click fuera = cerrar panel de edición
      if (current?.locked) {
        setEditorSelectedId(null);
        return;
      }
      const patch = { posicion: { x, y } };
      if (!current?.forma) patch.forma = DEFAULT_FORMA;
      if (!current?.tamano) patch.tamano = DEFAULT_TAMANO_RECT;
      if (!current?.acceso) patch.acceso = 'publica';
      updateCaseta(editorSelectedId, patch);
      setLastAssigned({ id: editorSelectedId, numero: current?.numero, x, y });
    },
    [editorSelectedId, casetas, updateCaseta],
  );

  const handleMoveCaseta = useCallback(
    (id, { x, y }) => {
      const c = casetas.find((cc) => cc.id === id);
      if (c?.locked) return;
      updateCaseta(id, { posicion: { x, y } });
    },
    [updateCaseta, casetas],
  );

  const handleResizeCaseta = useCallback(
    (id, tamano) => {
      const c = casetas.find((cc) => cc.id === id);
      if (c?.locked) return;
      updateCaseta(id, { tamano });
    },
    [updateCaseta, casetas],
  );

  const handleToggleLock = useCallback(() => {
    if (!editorSelectedId) return;
    const current = casetas.find((c) => c.id === editorSelectedId);
    const newLocked = !current?.locked;
    updateCaseta(editorSelectedId, { locked: newLocked });
    if (newLocked) {
      const nextId = nextPendingCasetaId(editorSelectedId);
      if (nextId) setEditorSelectedId(nextId);
    }
  }, [editorSelectedId, casetas, updateCaseta, nextPendingCasetaId]);

  const handleFieldChange = useCallback(
    (id, field, value) => {
      if (field === 'forma') {
        const cur = casetas.find((c) => c.id === id);
        const patch = { forma: value };
        if (value === 'circulo' && !cur?.tamano?.radio) {
          patch.tamano = DEFAULT_TAMANO_CIRC;
        }
        if (value === 'rect' && !cur?.tamano?.ancho) {
          patch.tamano = DEFAULT_TAMANO_RECT;
        }
        updateCaseta(id, patch);
        return;
      }
      updateCaseta(id, { [field]: value });
    },
    [updateCaseta, casetas],
  );

  const handleResetSelected = useCallback(() => {
    if (!editorSelectedId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('¿Quitar todos los cambios de esta caseta?')) return;
    resetCaseta(editorSelectedId);
    setLastAssigned(null);
  }, [editorSelectedId, resetCaseta]);

  const handleDownload = useCallback(() => {
    const json = JSON.stringify(casetas, null, 2) + '\n';
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'casetas.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [casetas]);

  // Al activar editor, auto-seleccionar primera pendiente si nada está seleccionado
  useEffect(() => {
    if (!editorMode) return;
    if (editorSelectedId) return;
    if (status !== 'ready') return;
    const first = casetas.find((c) => !c.posicion);
    if (first) setEditorSelectedId(first.id);
  }, [editorMode, editorSelectedId, casetas, status]);

  return (
    <div className={`app ${editorMode ? 'app-editor' : ''}`}>
      <header className="app-header">
        <h1>Feria de Jerez</h1>
        <span className="app-subtitle">Mapa de casetas</span>
      </header>

      <SearchBar
        value={query}
        onChange={setQuery}
        results={filteredCasetas}
        onSelect={(id) => {
          setSelectedId(id);
          setQuery('');
        }}
      />

      <main className="app-map">
        <MapView
          casetas={casetas}
          selectedId={editorMode ? editorSelectedId : selectedId}
          onSelect={(id) => {
            if (editorMode) {
              setEditorSelectedId(id);
            } else {
              setSelectedId(id);
            }
          }}
          editorMode={editorMode}
          onEditorClick={handleEditorClick}
          onMoveCaseta={handleMoveCaseta}
          onResizeCaseta={handleResizeCaseta}
        />
      </main>

      {!editorMode && selectedCaseta && (
        <CasetaPanel caseta={selectedCaseta} onClose={() => setSelectedId(null)} />
      )}

      {editorMode && (
        <EditorPanel
          casetas={casetas}
          selectedCaseta={editorSelectedCaseta}
          onSelectCasetaId={setEditorSelectedId}
          onClose={() => setEditorSelectedId(null)}
          onFieldChange={handleFieldChange}
          onToggleLock={handleToggleLock}
          onResetSelected={handleResetSelected}
          onDownload={handleDownload}
          stats={stats}
          lastAssigned={lastAssigned}
          syncStatus={status}
        />
      )}
    </div>
  );
}
