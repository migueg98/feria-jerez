import { useCallback, useEffect, useRef, useState } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';

const planoUrl = `${import.meta.env.BASE_URL}plano-feria.jpg`;
const planoFallback = `${import.meta.env.BASE_URL}plano-feria.svg`;

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="zoom-controls">
      <button type="button" onClick={() => zoomIn(0.25, 350, 'easeOutCubic')} aria-label="Acercar">+</button>
      <button type="button" onClick={() => zoomOut(0.25, 350, 'easeOutCubic')} aria-label="Alejar">−</button>
      <button
        type="button"
        onClick={() => resetTransform(500, 'easeOutCubic')}
        aria-label="Vista general"
        title="Vista general"
        style={{ fontSize: 16 }}
      >
        ⟳
      </button>
    </div>
  );
}

// Convierte coordenadas de pantalla a coordenadas del plano (sistema mapSize).
function screenToPlano(clientX, clientY, bgEl, mapSize) {
  const rect = bgEl.getBoundingClientRect();
  const scale = rect.width / mapSize.w;
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale,
  };
}

// Caseta sobre el plano. En modo editor soporta drag (mover) y resize (handles).
function CasetaShape({
  caseta,
  isSelected,
  editorMode,
  onSelect,
  onMove,
  onResize,
  planoBgRef,
  mapSize,
}) {
  const { x, y } = caseta.posicion;
  const forma = caseta.forma || 'rect';
  const tamano =
    caseta.tamano ||
    (forma === 'circulo' ? { radio: 10 } : { ancho: 24, alto: 16 });

  const tipoClass = `caseta-tipo-${caseta.tipo || 'tradicional'}`;
  const shapeClass = forma === 'circulo' ? 'caseta-circulo' : 'caseta-rect';

  const W = forma === 'circulo' ? tamano.radio * 2 : tamano.ancho;
  const H = forma === 'circulo' ? tamano.radio * 2 : tamano.alto;

  // Drag local: guardar offset donde empezó el click dentro de la caseta.
  // Solo en modo editor. Un drag > 3 px se considera movimiento (sino es click).
  const dragState = useRef(null);
  const justDraggedRef = useRef(false);

  const handlePointerDown = (e) => {
    if (!editorMode) return;
    if (caseta.locked) return; // caseta bloqueada: no se arrastra
    if (e.button !== undefined && e.button !== 0) return; // solo click izq / touch
    if (!planoBgRef.current) return;
    const coords = screenToPlano(e.clientX, e.clientY, planoBgRef.current, mapSize);
    dragState.current = {
      offsetX: coords.x - x,
      offsetY: coords.y - y,
      startX: coords.x,
      startY: coords.y,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e) => {
    if (!dragState.current) return;
    if (!planoBgRef.current) return;
    const coords = screenToPlano(e.clientX, e.clientY, planoBgRef.current, mapSize);
    const dx = coords.x - dragState.current.startX;
    const dy = coords.y - dragState.current.startY;
    if (!dragState.current.moved && Math.hypot(dx, dy) > 3) {
      dragState.current.moved = true;
    }
    if (dragState.current.moved) {
      const newX = Math.round(coords.x - dragState.current.offsetX);
      const newY = Math.round(coords.y - dragState.current.offsetY);
      onMove(caseta.id, { x: newX, y: newY });
      e.stopPropagation();
    }
  };

  const handlePointerUp = (e) => {
    if (!dragState.current) return;
    justDraggedRef.current = dragState.current.moved;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    dragState.current = null;
  };

  const style = {
    left: `${x - W / 2}px`,
    top: `${y - H / 2}px`,
    width: `${W}px`,
    height: `${H}px`,
  };

  return (
    <div
      id={`caseta-${caseta.id}`}
      className={`${shapeClass} ${tipoClass} ${isSelected ? 'selected' : ''}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (justDraggedRef.current) {
          justDraggedRef.current = false;
          return;
        }
        onSelect(caseta.id);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label={`Caseta ${caseta.numero}: ${caseta.nombre}`}
      title={`${caseta.numero} · ${caseta.nombre}`}
      role="button"
      tabIndex={0}
    >
      <span className="caseta-label">{caseta.numero}</span>
      {caseta.locked && <span className="caseta-lock-badge" aria-hidden="true">🔒</span>}
      {editorMode && isSelected && !caseta.locked && (
        <ResizeHandles
          caseta={caseta}
          forma={forma}
          tamano={tamano}
          onResize={onResize}
          planoBgRef={planoBgRef}
          mapSize={mapSize}
        />
      )}
    </div>
  );
}

// Handles para redimensionar. Para rect: 4 esquinas. Para círculo: 1 en el borde derecho.
function ResizeHandles({ caseta, forma, tamano, onResize, planoBgRef, mapSize }) {
  const resizeState = useRef(null);

  const startResize = (corner) => (e) => {
    e.stopPropagation();
    if (!planoBgRef.current) return;
    const coords = screenToPlano(
      e.clientX,
      e.clientY,
      planoBgRef.current,
      mapSize,
    );
    resizeState.current = {
      corner,
      startX: coords.x,
      startY: coords.y,
      initialTamano: { ...tamano },
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const doResize = (e) => {
    if (!resizeState.current) return;
    if (!planoBgRef.current) return;
    e.stopPropagation();
    const coords = screenToPlano(
      e.clientX,
      e.clientY,
      planoBgRef.current,
      mapSize,
    );
    const dx = coords.x - resizeState.current.startX;
    const dy = coords.y - resizeState.current.startY;
    const { corner, initialTamano } = resizeState.current;

    if (forma === 'circulo') {
      // Radio = distancia desde el centro al puntero
      const newR = Math.max(
        4,
        Math.round(Math.hypot(coords.x - caseta.posicion.x, coords.y - caseta.posicion.y)),
      );
      onResize(caseta.id, { radio: newR });
      return;
    }

    // Rectángulo: ajusta ancho/alto según la esquina arrastrada
    let deltaW = 0;
    let deltaH = 0;
    if (corner.includes('e')) deltaW = dx * 2;
    if (corner.includes('w')) deltaW = -dx * 2;
    if (corner.includes('s')) deltaH = dy * 2;
    if (corner.includes('n')) deltaH = -dy * 2;

    const newW = Math.max(6, Math.round(initialTamano.ancho + deltaW));
    const newH = Math.max(6, Math.round(initialTamano.alto + deltaH));
    onResize(caseta.id, { ancho: newW, alto: newH });
  };

  const endResize = (e) => {
    if (!resizeState.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    resizeState.current = null;
  };

  const handleProps = (corner) => ({
    className: `caseta-handle caseta-handle-${corner}`,
    onPointerDown: startResize(corner),
    onPointerMove: doResize,
    onPointerUp: endResize,
    onPointerCancel: endResize,
  });

  if (forma === 'circulo') {
    return <span {...handleProps('e')} />;
  }

  return (
    <>
      <span {...handleProps('nw')} />
      <span {...handleProps('ne')} />
      <span {...handleProps('sw')} />
      <span {...handleProps('se')} />
    </>
  );
}

export default function MapView({
  casetas,
  selectedId,
  onSelect,
  editorMode,
  onEditorClick,
  onMoveCaseta,
  onResizeCaseta,
}) {
  const containerRef = useRef(null);
  const transformRef = useRef(null);
  const planoBgRef = useRef(null);
  const [mapSize, setMapSize] = useState({ w: 3000, h: 2120 });
  const [minScale, setMinScale] = useState(0.3);
  const [imgSrc, setImgSrc] = useState(planoUrl);

  // Detectar dimensiones naturales del plano al cargar
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setMapSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      setImgSrc(planoFallback);
      const img2 = new Image();
      img2.onload = () =>
        setMapSize({
          w: img2.naturalWidth || 1024,
          h: img2.naturalHeight || 707,
        });
      img2.src = planoFallback;
    };
    img.src = planoUrl;
  }, []);

  // minScale dinámico según tamaño del contenedor
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      if (!cw || !ch) return;
      const fit = Math.min(cw / mapSize.w, ch / mapSize.h);
      setMinScale(Math.max(fit * 0.95, 0.05));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [mapSize]);

  // Mantener casetas en ref para evitar re-disparar el zoom al editar campos
  const casetasRef = useRef(casetas);
  useEffect(() => {
    casetasRef.current = casetas;
  }, [casetas]);

  // Zoom a la caseta seleccionada (solo al cambiar la selección, no al editar).
  // Animación lineal y destino moderado para que el salto sea gradual.
  useEffect(() => {
    if (!selectedId || !transformRef.current || !containerRef.current) return;
    const caseta = casetasRef.current.find((c) => c.id === selectedId);
    if (!caseta?.posicion) return;
    const { x, y } = caseta.posicion;
    const cont = containerRef.current;
    const w = cont.clientWidth;
    const h = cont.clientHeight;
    // Respetamos el zoom actual si ya estaba cerca; sino subimos ligeramente.
    const currentScale = transformRef.current.instance?.transformState?.scale || minScale;
    const comfy = Math.max(minScale * 1.6, 0.7);
    const target = Math.max(currentScale, comfy);
    transformRef.current.setTransform(
      -x * target + w / 2,
      -y * target + h / 2,
      target,
      1000,
      'linear',
    );
  }, [selectedId, minScale]);

  const handlePlanoClick = useCallback(
    (e) => {
      if (editorMode && onEditorClick) {
        const bg = e.currentTarget;
        const coords = screenToPlano(e.clientX, e.clientY, bg, mapSize);
        onEditorClick(Math.round(coords.x), Math.round(coords.y));
        return;
      }
      if (!editorMode) onSelect(null);
    },
    [editorMode, onEditorClick, mapSize, onSelect],
  );

  return (
    <div className="map-view" ref={containerRef}>
      <TransformWrapper
        ref={transformRef}
        initialScale={minScale}
        minScale={minScale}
        maxScale={8}
        centerOnInit
        limitToBounds
        smooth
        wheel={{ step: 0.03, smoothStep: 0.0012 }}
        doubleClick={{ mode: 'zoomIn', step: 0.2, animationTime: 300, animationType: 'linear' }}
        panning={{
          velocityDisabled: false,
          excluded: ['caseta-rect', 'caseta-circulo', 'caseta-handle', 'caseta-label'],
        }}
        pinch={{ step: 1 }}
        velocityAnimation={{ sensitivity: 1, animationTime: 450, animationType: 'linear' }}
        zoomAnimation={{ animationTime: 300, animationType: 'linear' }}
        alignmentAnimation={{ animationTime: 500, animationType: 'linear' }}
      >
        <ZoomControls />
        <TransformComponent
          wrapperClass="plano-wrapper"
          contentClass="plano-content"
        >
          <div
            ref={planoBgRef}
            className="plano-bg"
            style={{
              width: `${mapSize.w}px`,
              height: `${mapSize.h}px`,
              backgroundImage: `url("${imgSrc}")`,
              backgroundSize: `${mapSize.w}px ${mapSize.h}px`,
              backgroundRepeat: 'no-repeat',
            }}
            onClick={handlePlanoClick}
          >
            {casetas
              .filter((c) => c.posicion)
              .map((c) => (
                <CasetaShape
                  key={c.id}
                  caseta={c}
                  isSelected={c.id === selectedId}
                  editorMode={editorMode}
                  onSelect={onSelect}
                  onMove={onMoveCaseta}
                  onResize={onResizeCaseta}
                  planoBgRef={planoBgRef}
                  mapSize={mapSize}
                />
              ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
