import { useMemo, useState } from 'react';
import MapView from './components/MapView.jsx';
import SearchBar from './components/SearchBar.jsx';
import CasetaPanel from './components/CasetaPanel.jsx';
import casetas from './data/casetas.json';

function normalize(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // Modo editor: activar con ?editor=1 en la URL.
  // En este modo, al hacer clic en el plano se muestran las coordenadas
  // para pegar en casetas.json.
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
  }, [query]);

  const selectedCaseta = useMemo(
    () => casetas.find((c) => c.id === selectedId) || null,
    [selectedId]
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Feria de Jerez</h1>
        <span className="app-subtitle">Mapa de casetas</span>
      </header>

      <SearchBar
        value={query}
        onChange={setQuery}
        results={filteredCasetas}
        onSelect={(id) => setSelectedId(id)}
      />

      <main className="app-map">
        <MapView
          casetas={filteredCasetas}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          editorMode={editorMode}
        />
      </main>

      {selectedCaseta && (
        <CasetaPanel
          caseta={selectedCaseta}
          onClose={() => setSelectedId(null)}
        />
      )}

      {editorMode && (
        <div className="editor-banner">
          MODO EDITOR · Haz clic en el plano para ver coordenadas
        </div>
      )}
    </div>
  );
}
