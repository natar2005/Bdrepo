# Nataly Vanessa Rengifo Bautista — Portafolio

Este proyecto es mi portafolio personal como estudiante de Ingeniería de Sistemas e Ingeniería Robótica en la Universidad El Bosque.

La idea del portafolio nació para organizar y presentar las evidencias de **Bases de Datos 1**, pero decidí hacerlo de una forma que también me sirviera a futuro como una presentación personal y profesional. Por eso, además de las evidencias de la materia, incluí información sobre mí, algunos de mis proyectos y diferentes formas de contacto.

El diseño está inspirado en la pintura, buscando que el portafolio no fuera solamente una página con información, sino que también tuviera una identidad visual propia.

## Sobre el proyecto

Desarrollé el portafolio utilizando **Angular 18**. Una de las ideas principales era que pudiera seguir actualizándolo fácilmente a medida que avance en la carrera y tenga nuevas evidencias, proyectos o investigaciones.

El sitio cuenta con una página principal donde se encuentra mi presentación, un video, las evidencias de la asignatura y la información de contacto. También tiene una página independiente para cada categoría de evidencias.

## Tecnologías utilizadas

* Angular 18
* TypeScript
* Angular Router
* `HashLocationStrategy`, para facilitar el despliegue en GitHub Pages
* Canvas API
* CSS con variables personalizadas para manejar los estilos y colores
* Node.js, utilizado para generar automáticamente el listado de evidencias

## Funcionalidades

### Retrato interactivo

Una de las partes principales de la página es mi retrato. Al pasar el cursor sobre la imagen, hacer clic o enfocarla con el teclado, cambia a una ilustración, además, alrededor del retrato aparece una paleta de colores que muestra algunos datos curiosos sobre mí.

### Evidencias de Bases de Datos

Las evidencias están organizadas en cinco categorías:

* Modelo
* Normalización
* SQL
* Investigación
* Proyecto

Cada categoría tiene su propio ícono y página. Desde allí se pueden consultar los archivos que se encuentren dentro de la carpeta correspondiente.

La idea es poder agregar nuevas evidencias sin tener que modificar manualmente la página cada vez.

### Contacto

La página también cuenta con diferentes opciones para contactarme:

* Correo personal
* Correo institucional
* GitHub

## Instalación y ejecución local

Para ejecutar el proyecto localmente se necesita **Node.js 18 o superior**.

Primero se instalan las dependencias:

```bash
npm install
```

Luego se inicia el proyecto:

```bash
npm start
```

También se puede generar una compilación para producción con:

```bash
npm run build
```

## ¿Cómo agregar nuevas evidencias?

Angular genera el sitio como archivos estáticos, por lo que no puede estar revisando directamente las carpetas del computador mientras la página está funcionando.

Para solucionar esto, hice un pequeño script que revisa automáticamente las carpetas de evidencias y genera un `manifest.json` con los archivos encontrados.

### 1. Entrar a la carpeta de evidencias

Las carpetas están organizadas de esta manera:

```text
src/assets/evidencias/
├── modelo/
├── normalizacion/
├── sql/
├── investigacion/
└── proyecto/
```

### 2. Copiar la evidencia

Solo hay que colocar el archivo correspondiente dentro de la carpeta de la categoría.

Por ejemplo:

```text
src/assets/evidencias/sql/nombrearchivo.pdf
```

### 3. Actualizar el listado

Al ejecutar:

```bash
npm start
```

o:

```bash
npm run build
```

el proyecto genera automáticamente el listado de archivos.

Si la página ya está ejecutándose y se agrega una evidencia nueva, también se puede ejecutar:

```bash
npm run evidencias:index
```

Después de esto solo es necesario recargar la página.

El encargado de hacer este proceso es:

```text
scripts/generate-evidence-manifest.js
```

Este script recorre las carpetas de cada categoría y genera un `manifest.json` con los archivos encontrados.

Luego, el componente `EvidenceCategoryPageComponent` lee ese archivo para mostrar las evidencias en la página.

## Estructura del proyecto

```text
src/
  app/
    app.component.ts/html/css
        → Elementos generales de la aplicación: loader, cursor,
          fondo, navbar y footer

    app.routes.ts
        → Rutas de la página principal y las categorías de evidencias

    app.config.ts
        → Configuración del Router y HttpClient

    pages/
      home/
        → Página principal: presentación, sobre mí, video,
          evidencias y contacto

      evidence-category-page/
        → Página utilizada para mostrar las evidencias de cada categoría

        evidence-categories.ts
          → Configuración de nombres, títulos, colores e íconos
            de las categorías

    components/
      paint-background/
        → Fondo animado inspirado en pintura

      paint-cursor/
        → Cursor personalizado con forma de gota de pintura

      app-loader/
        → Pantalla de carga inicial

      navbar/
        → Barra de navegación fija, scroll-spy y navegación entre rutas

      portrait-panel/
        → Retrato interactivo y datos curiosos

      video-section/
        → Sección del video de presentación

      evidence-gallery/
        → Menú de categorías de evidencias

      contact-section/
        → Información y opciones de contacto

    directives/
      reveal-on-scroll.directive.ts
        → Animaciones de aparición al hacer scroll

  assets/
    images/
        → Imágenes utilizadas en el portafolio

    evidencias/
        → Carpetas donde se guardan las evidencias

    videos/
        → Video de presentación

  styles.css
    → Estilos generales, colores y tipografía

scripts/
  generate-evidence-manifest.js
    → Script encargado de generar los manifest de evidencias
```

