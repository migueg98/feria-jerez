import { useState } from 'react';

export default function SearchBar({ value, onChange, results, onSelect }) {
  const [focused, setFocused] = useState(false);

  // Solo mostrar el dropdown si el usuario está escribiendo y hay query
  const showResults = focused && value.trim().length > 0;

  const handleSelect = (id) => {
    onSelect(id);
    setFocused(false);
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          inputMode="search"
          placeholder="Buscar caseta por nombre o número…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          aria-label="Buscar caseta"
        />
        {value && (
          <button
            type="button"
            className="search-clear"
            onClick={() => onChange('')}
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>

      {showResults && (
        <ul className="search-results">
          {results.length === 0 ? (
            <li className="search-empty">No hay ninguna caseta con ese nombre</li>
          ) : (
            results.slice(0, 10).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="search-result-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(c.id)}
                >
                  <span className="result-number">{c.numero}</span>
                  <span className="result-name">{c.nombre}</span>
                  {c.tipo && <span className={`result-tipo tipo-${c.tipo}`}>{c.tipo}</span>}
                </button>
              </li>
            ))
          )}
          {results.length > 10 && (
            <li className="search-more">+{results.length - 10} más…</li>
          )}
        </ul>
      )}
    </div>
  );
}
