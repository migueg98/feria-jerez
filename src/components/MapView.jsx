import { useEffect } from 'react';
import { MapContainer, ImageOverlay, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Dimensiones del SVG del plano (coinciden con el viewBox del archivo)
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 700;

// Con CRS.Simple, las coordenadas son [y, x] en píxeles.
// El origen (0,0) está en la esquina superior izquierda del SVG.
const bounds = [
  [0, 0],
  [MAP_HEIGHT, MAP_WIDTH],
];

// Ruta al plano (respetando el base path de Vite para GitHub Pages)
const planoUrl = `${import.meta.env.BASE_URL}plano-feria.svg`;

// Icono personalizado para casetas: círculo rojo con el número dentro
function createCasetaIcon(numero, isSelected = false) {
  const size = isSelected ? 36 : 28;
  const html = `
    <div class="caseta-marker ${isSelected ? 'selected' : ''}">
      <span>${numero}</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'caseta-marker-wrapper',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Centra el mapa suavemente en la caseta seleccionada
function MapController({ selectedCaseta }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCaseta && selectedCaseta.posicion) {
      const { x, y } = selectedCaseta.posicion;
      map.flyTo([y, x], Math.max(map.getZoom(), 1), { duration: 0.5 });
    }
  }, [selectedCaseta, map]);
  return null;
}

// Modo editor: al hacer clic en el plano, copia coordenadas al portapapeles.
// Activar con ?editor=1 en la URL. Muy útil para colocar casetas.
function EditorClickHandler({ enabled }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      const x = Math.round(e.latlng.lng);
      const y = Math.round(e.latlng.lat);
      const snippet = `"posicion": { "x": ${x}, "y": ${y} }`;
      try {
        navigator.clipboard?.writeText(snippet);
      } catch (_) {
        // Silenciar: algunos navegadores requieren HTTPS para clipboard
      }
      // eslint-disable-next-line no-alert
      alert(`Coordenadas copiadas al portapapeles:\n\n${snippet}`);
    },
  });
  return null;
}

export default function MapView({ casetas, selectedId, onSelect, editorMode }) {
  const selectedCaseta = casetas.find((c) => c.id === selectedId) || null;

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      minZoom={-1}
      maxZoom={2}
      zoom={0}
      center={[MAP_HEIGHT / 2, MAP_WIDTH / 2]}
      style={{ height: '100%', width: '100%', background: '#f4e4c1' }}
      attributionControl={false}
      zoomControl={true}
    >
      <ImageOverlay url={planoUrl} bounds={bounds} />

      {casetas
        .filter((c) => c.posicion)
        .map((c) => (
          <Marker
            key={c.id}
            position={[c.posicion.y, c.posicion.x]}
            icon={createCasetaIcon(c.numero, c.id === selectedId)}
            eventHandlers={{
              click: () => onSelect(c.id),
            }}
          />
        ))}

      <MapController selectedCaseta={selectedCaseta} />
      <EditorClickHandler enabled={editorMode} />
    </MapContainer>
  );
}
