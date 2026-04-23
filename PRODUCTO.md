# Documento de producto · Feria de Jerez · Mapa de casetas

> Versión: 0.1 (MVP)
> Fecha: Abril 2026
> Responsable: @migueg98

---

## 1. Descripción del proyecto

Aplicación web (no nativa) que ofrece un mapa interactivo de las casetas de la Feria del Caballo de Jerez, pensada para consumo en móvil durante la propia feria. Sustituye al plano oficial estático con una experiencia buscable y filtrable.

## 2. Objetivo

Permitir al visitante encontrar rápidamente una caseta concreta (por nombre o número) y obtener información básica sobre ella sin descargar una app ni registrarse.

## 3. Público objetivo

- Vecinos de Jerez de la Frontera que van cada año a la feria.
- Visitantes de otras ciudades que acuden por primera vez.
- Grupos que buscan reencontrarse en la feria y necesitan localizar una caseta.

Perfil técnico: **usuario medio con móvil**. No se exige instalación, registro ni conocimientos técnicos.

## 4. Funcionalidades actuales (MVP v0.1)

1. **Plano interactivo** del recinto con zoom, pan y marcadores para cada caseta.
2. **Buscador en tiempo real** por nombre, número o tipo.
3. **Panel de información** al pulsar un marcador (nombre, número, tipo, descripción, música, foto si existe).
4. **Compartir por WhatsApp** con enlace profundo a la caseta.
5. **Modo editor** (interno, vía `?editor=1`) para posicionar casetas en el plano obteniendo coordenadas al hacer clic.
6. **Responsive** optimizado para móvil.
7. **Datos en JSON local**, fácilmente editables sin tocar código React.

## 5. Posibles mejoras futuras

### v1.0 (corto plazo, tras primera semana de uso)
- **Calibración GPS del plano**: mapear 2 puntos del plano a coordenadas reales del recinto en González Hontoria para mostrar la ubicación real del usuario con `navigator.geolocation`.
- **Filtros por tipo de caseta** (pública, privada, peña, institucional…).
- **Favoritos** guardados en `localStorage`.
- **Deep-link** `?caseta=ID` que abra directamente el panel de una caseta (útil para enlaces compartidos por WhatsApp).

### v2.0 (producto completo)
- **Valoraciones de usuarios** (requiere backend o servicio BaaS tipo Supabase/Firebase).
- **Ranking de casetas** basado en valoraciones.
- **Casetas destacadas/patrocinadas** como vía de monetización.
- **Filtros avanzados**: música, ambiente, rango de edad, accesibilidad.
- **Horarios específicos** (apertura/cierre por día de feria).
- **Fotos de usuarios** (moderadas).
- **PWA instalable** con modo offline.
- **Modo noche** y accesibilidad WCAG AA.

## 6. Decisiones técnicas

| Decisión | Alternativa considerada | Razón |
|---|---|---|
| **React con Vite** | HTML + JS vanilla | Componentes reutilizables y estado simple con JSX. Vite es más rápido de desarrollar que Create React App. |
| **Leaflet** con `CRS.Simple` | Mapbox, Google Maps | Leaflet es gratuito, ligero y `CRS.Simple` permite usar un plano propio sin coordenadas GPS. |
| **Plano custom SVG** (no OpenStreetMap) | Mapa real de OSM con coordenadas GPS | El recinto de González Hontoria no tiene sus calles internas dibujadas en OSM; un plano estilizado propio es mucho más útil para el visitante. |
| **SVG** (no imagen PNG/JPG) | Imagen rasterizada del plano oficial | Escala infinitamente, pesa 10-30 KB frente a 500+ KB, es editable como texto. |
| **JSON local** | Backend + BBDD | Sin login, sin escrituras, solo lectura. Cero coste y cero mantenimiento. |
| **CSS plano** | Tailwind / styled-components | MVP pequeño; añadir frameworks introduciría complejidad innecesaria. |
| **GitHub Pages** | Vercel, Netlify | Hosting gratuito y estable. Integración trivial con el repositorio. |
| **Sin TypeScript** | Proyecto tipado | El proyecto es muy pequeño; TypeScript ralentizaría el desarrollo inicial. Se puede migrar en v2 si crece. |
| **Sin PWA en MVP** | PWA instalable desde el inicio | Añade complejidad (manifest, service worker, iconos). Se pospone a v2. |

## 7. Limitaciones actuales conocidas

1. **Geolocalización real no implementada.** El mapa usa coordenadas de plano (píxeles), no GPS. Mostrar la ubicación real del usuario requiere calibrar 2 esquinas del plano con coordenadas reales del recinto; pendiente para v1.
2. **El plano es una representación estilizada**, no una réplica exacta al milímetro del recinto. Sirve para orientarse, no para medidas reales.
3. **Sin persistencia de datos**: las casetas se editan en el código y hay que redesplegar para que los cambios sean visibles al público.
4. **Sin analítica**: no sabemos cuántos visitantes usan la app ni qué casetas se buscan más. Fácil de añadir (Plausible/Umami).
5. **Sin backend**: no se pueden implementar valoraciones, comentarios, ni datos dinámicos sin añadir un servicio externo (cosa que se ha descartado para el MVP a propósito).
6. **Búsqueda básica**: filtra solo por nombre/número/tipo. No hay búsqueda fuzzy ni autocompletado inteligente.
7. **Sin autenticación**: intencional. El producto no la necesita en esta fase.

## 8. Métricas de éxito del MVP

- El sitio carga en **< 2 segundos en 4G** en un móvil de gama media.
- Usuario encuentra una caseta buscando por nombre en **≤ 3 toques**.
- **0 errores de JavaScript** en navegadores modernos (Safari iOS 15+, Chrome Android 12+).
- Al menos **50 casetas** posicionadas y visibles en el plano antes del primer día de feria.

## 9. Guía de despliegue paso a paso

Ver `README.md` sección "Despliegue" y la guía detallada con GitHub Desktop en la respuesta del chat.

---

*Documento vivo: actualizar tras cada iteración o cambio significativo.*
