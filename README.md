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

Cada categoría tiene su propio ícono y página. Desde allí se pueden consultar los archivos que se encuentren dentro de la carpeta correspondiente, sin necesidad de descargarlos:

* **Modelo:** cada diagrama tiene su miniatura y se abre en un visor donde se puede acercar con la rueda del mouse (o pellizcando en el celular) y moverse arrastrando. Los proyectos de Data Modeler quedan como adjuntos para descargar.
* **Normalización:** el Excel se ve dentro de la página, con una pestaña por hoja. Cada hoja se puede ver "paso a paso" (las tablas de cada paso, las tablas nuevas y los atributos que salen, junto a la explicación de la tabla de pasos) o tal cual como hoja de Excel.
* **SQL:** los scripts se leen como en un editor, con números de línea, colores y un índice para saltar a cada consulta. También se pueden copiar o descargar.
* **Investigación y Proyecto:** cada documento muestra su portada y se abre en el visor de PDF. Los documentos de Word tienen una vista previa en PDF y al descargarlos se obtiene el .docx original.

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

### 4. Opcional: grupos, títulos y portadas

Para que las evidencias se vean más ordenadas se pueden usar estas convenciones (ninguna es obligatoria):

* **Subcarpetas = grupos.** Cada subcarpeta de una categoría aparece como un grupo con su propio título, por ejemplo `modelo/archiveludo/`.
* **`catalogo.json`** en la carpeta de la categoría: define el texto de introducción, el orden de los grupos, y el título, la descripción y la etiqueta de cada archivo. Los archivos que no estén en el catálogo igual aparecen, con un título armado desde su nombre.

  ```json
  {
    "introduccion": "Texto que aparece debajo del título de la página.",
    "grupos": [
      {
        "carpeta": "archiveludo",
        "titulo": "Proyecto final · ArchiveLudo",
        "descripcion": "Texto corto del grupo.",
        "archivos": {
          "05-modelo-relacional-archiveludo.png": {
            "titulo": "Modelo relacional",
            "descripcion": "Las 17 tablas finales.",
            "etiqueta": "Data Modeler",
            "adjuntos": ["modelo-relacional-data-modeler.zip"]
          }
        }
      }
    ],
    "relacionados": [
      { "ruta": "proyecto/diseno-bd/normalizacion-archiveludo.pdf", "titulo": "Normalización del proyecto" }
    ]
  }
  ```

  Con `"adjuntos"` un archivo (por ejemplo el .zip de Data Modeler) se muestra dentro de la tarjeta de otro, y con `"destacado": true` un documento ocupa todo el ancho. `"relacionados"` muestra al final de la página archivos de otras categorías.
* **`_portadas/`** dentro del grupo: una imagen con el mismo nombre del archivo (`.webp`, `.jpg` o `.png`) se usa como portada. Si un PDF no tiene portada, la tarjeta muestra el tipo de archivo.
* **`_vistas/`** dentro del grupo: un PDF con el mismo nombre de un documento de Word se usa para verlo en la página.
* **Excel:** el script lee cada `.xlsx` y guarda sus hojas en `_vistas/<nombre>.json`; no hay que hacer nada más.
* **SQL:** el título y la descripción de cada script salen del comentario del inicio, por ejemplo `-- Apuntes 01: selección, proyección y renombrado`.

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

      evidence-shelf/
        → Tarjetas con portada de cada evidencia

      evidence-viewer/
        → Visor a pantalla completa (zoom de diagramas y PDF)

      sheet-viewer/
        → Hojas de Excel: vista paso a paso y vista de hoja

      sql-explorer/
        → Lector de scripts SQL con resaltado de sintaxis

      contact-section/
        → Información y opciones de contacto

    models/
      evidence.models.ts
        → Forma de los manifest.json y de las vistas de Excel

    services/
      evidence.service.ts
        → Carga los manifest, los scripts y las hojas de Excel
      evidence-viewer.service.ts
        → Abre y cierra el visor de evidencias

    utils/
      sql-highlight.ts
        → Resaltado de sintaxis SQL e índice de cada script
      color.ts
        → Ajusta los colores de cada categoría para que se lean bien

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
  xlsx-preview.js
    → Lee los archivos de Excel para poder mostrarlos en la página
```

