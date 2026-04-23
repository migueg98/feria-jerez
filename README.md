# Feria de Jerez · Mapa de casetas

Mapa interactivo de las casetas de la Feria del Caballo de Jerez. Permite buscar casetas por nombre o número y ver su información en un plano simplificado del recinto.

URL pública (tras desplegar): <https://migueg98.github.io/feria-jerez/>

---

## Stack

- **Vite + React** (JSX, sin TypeScript)
- **Leaflet + react-leaflet** con `CRS.Simple` (mapa sobre plano custom, no GPS)
- **CSS plano** (sin frameworks)
- **JSON local** como "base de datos"
- **GitHub Actions + GitHub Pages** para deploy automático

---

## Requisitos

- [Node.js 18+](https://nodejs.org/) (incluye `npm`)
- Un navegador moderno
- [GitHub Desktop](https://desktop.github.com/) (para subir cambios sin tocar terminal)

---

## Desarrollo local

Primera vez (instalar dependencias):

```bash
npm install
```

Levantar el servidor de desarrollo (con recarga en caliente):

```bash
npm run dev
```

Se abrirá en `http://localhost:5173/feria-jerez/`.

Generar build de producción (para probar antes de desplegar):

```bash
npm run build
npm run preview
```

---

## Estructura

```
feria-jerez/
├── public/
│   ├── plano-feria.svg         # Plano de la feria (editable)
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── MapView.jsx         # Mapa con Leaflet + marcadores
│   │   ├── SearchBar.jsx       # Buscador con resultados
│   │   └── CasetaPanel.jsx     # Panel info + WhatsApp
│   ├── data/
│   │   └── casetas.json        # Lista de casetas (editar aquí)
│   ├── styles/
│   │   └── main.css            # Todos los estilos
│   ├── App.jsx                 # Componente raíz
│   └── main.jsx                # Entry point
├── .github/workflows/deploy.yml # CI/CD automático
├── index.html
├── vite.config.js
├── package.json
├── README.md
└── PRODUCTO.md                 # Especificación del producto
```

---

## Cómo editar casetas

Todas las casetas viven en `src/data/casetas.json`. Cada entrada:

```json
{
  "id": 1,
  "numero": "001",
  "nombre": "Caseta Los Amigos",
  "tipo": "publica",
  "descripcion": "Caseta familiar, ambiente tranquilo.",
  "musica": "Sevillanas y pop español",
  "foto": null,
  "posicion": { "x": 150, "y": 125 }
}
```

**Campos obligatorios:** `id`, `numero`, `nombre`, `posicion`.
**Campos opcionales (pueden dejarse vacíos o como `null`):** `tipo`, `descripcion`, `musica`, `foto`.

Tipos válidos: `publica`, `privada`, `peña`, `institucional`, `empresarial`, `familiar`.

### Modo editor (colocar casetas en el plano)

Abre la app con `?editor=1` al final de la URL:

```
http://localhost:5173/feria-jerez/?editor=1
```

Al hacer clic en el plano, se copian las coordenadas `{ "x": ..., "y": ... }` al portapapeles. Pégalas en el JSON. Este es el método rápido para posicionar casetas sin calcular a mano.

---

## Cómo editar el plano

El plano está en `public/plano-feria.svg`. Es un SVG editable con cualquier editor de texto (o Figma/Inkscape si prefieres visual). Dimensiones: **1000 x 700**. Si cambias las dimensiones, actualiza `MAP_WIDTH` y `MAP_HEIGHT` en `src/components/MapView.jsx`.

---

## Despliegue

### Primera vez (configuración, solo una vez)

1. Crea el repositorio `feria-jerez` en tu cuenta de GitHub (público).
2. En **Settings → Pages** del repo, en "Build and deployment", selecciona **Source: GitHub Actions**.
3. Sube el código con GitHub Desktop (ver sección siguiente).
4. La primera vez que subas, el workflow desplegará automáticamente. Ve a la pestaña **Actions** del repo para ver el progreso.
5. Tras ~1-2 minutos, la web estará en <https://migueg98.github.io/feria-jerez/>.

### Cada cambio futuro

Cualquier push a la rama `main` lanza el despliegue automáticamente. No tienes que hacer nada más.

---

## Flujo de trabajo con GitHub Desktop

Ver `PRODUCTO.md` sección "Guía de despliegue" para el paso a paso visual.
