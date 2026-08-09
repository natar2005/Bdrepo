# Nataly Vanessa Rengifo Bautista — Portafolio

Portafolio profesional de Ingeniería de Sistemas e Ingeniería Robótica (Universidad El
Bosque): proyectos, evidencias de Bases de Datos y una presentación personal,
con una identidad visual propia inspirada en la pintura.

**Sitio publicado:**

## Sobre el proyecto

Empecé este portafolio para Bases de Datos 1, pero lo construí pensando
en que me sirviera más allá de la asignatura: como una carta de presentación profesional que
pueda seguir actualizando con cada evidencia, investigación y avance de proyectos. Lo
desarrollé en Angular .

## Tecnologías

- Angular 18 
- Angular Router (con `HashLocationStrategy`, pensado para GitHub Pages)
- TypeScript
- Canvas API 
- CSS con variables personalizadas para theming
- Un pequeño script de Node (sin dependencias) para indexar archivos de evidencias

## Funcionalidades

- **Retrato interactivo** — mi foto con marco pintado; al pasar el cursor (o hacer foco/click,
  también accesible por teclado) cambia a una ilustración, y una paleta de colores revela
  datos curiosos sobre mí.
- **Evidencias de la asignatura, con páginas propias** — cinco categoría (Modelo, Normalización,
  SQL, Investigación, Proyecto), cada una con su propio ícono.
  Al hacer clic en una, se navega a su propia página donde se listan
  los archivos que vaya subiendo a esa carpeta
- **Contacto** — tarjetas con correo personal, correo institucional y GitHub.

## Instalación y ejecución local

Requiere Node.js 18 o superior.

```bash
npm install
npm start
```

## Cómo subir evidencias (Modelo, Normalización, SQL, Investigación, Proyecto)

Angular compila el sitio como archivos estáticos, así que no puede "leer una carpeta"
del computador en tiempo real. Para que de todos modos sea tan simple como arrastrar un
archivo, el proyecto indexa esas carpetas automáticamente antes de cada `npm start` /
`npm run build`:

1. Se debe ubicar la carpeta de la categoría dentro de `src/assets/evidencias/`:
   - `src/assets/evidencias/modelo/`
   - `src/assets/evidencias/normalizacion/`
   - `src/assets/evidencias/sql/`
   - `src/assets/evidencias/investigacion/`
   - `src/assets/evidencias/proyecto/`
2. Se debe copiar ahí los archivos .
3. Correr `npm start` o `npm run build` como siempre (o, si el sitio ya está corriendo,
   `npm run evidencias:index` y se deberá recargar la página).
Nota:
El script `scripts/generate-evidence-manifest.js` recorre cada carpeta y
genera un `manifest.json` con la lista de archivos encontrados; la página de cada
categoría (`EvidenceCategoryPageComponent`) simplemente lee ese `manifest.json` por HTTP.




## Estructura del proyecto

```
src/
  app/
    app.component.ts/html/css        → global: loader, cursor, fondo, navbar, footer
    app.routes.ts                    → rutas: home  y una por cada categoría de evidencias
    app.config.ts                    → providers: Router (hash) y HttpClient
    pages/
      home/                          → página de inicio (Nombre, Sobre mí, Video, Evidencias, Contacto)
      evidence-category-page/        → página para cada categoría(una pagina para las n evidencias)
        evidence-categories.ts       → slugs, títulos, colores, íconos
    components/
      paint-background/              → fondo animado
      paint-cursor/                  → cursor personalizado (gota de pintura)
      app-loader/                    → pantalla de carga inicial con nombre escrito
      navbar/                        → navegación fija, con scroll-spy y soporte de rutas
      portrait-panel/                → retrato interactivo y datos curiosos
      video-section/                 → tarjeta del video de presentación
      evidence-gallery/              → menú de evidencias
      contact-section/               → opciones de contacto
    directives/
      reveal-on-scroll.directive.ts  → fade-in al hacer scroll 
  assets/
    images/                          → fotos 
    evidencias/                      → carpetas de evidencias
    videos/                          → video presentación
  styles.css                         → paleta de colores y tipografía base 
scripts/
  generate-evidence-manifest.js      → indexa las carpetas de evidencias
```
