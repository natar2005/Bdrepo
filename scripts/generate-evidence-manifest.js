#!/usr/bin/env node
/**
 * generate-evidence-manifest.js
 * ------------------------------------------------------------------
 * Angular, al compilar (`ng build`) o servir (`ng serve`) el proyecto,
 * solo puede mostrar contenido que ya existía en disco en ese momento:
 * no puede "listar una carpeta" del servidor en tiempo real porque el
 * resultado final es un sitio 100% estático.
 *
 * Para que Nataly pueda simplemente arrastrar archivos a una carpeta
 * (por ejemplo `src/assets/evidencias/sql/`) y que aparezcan solos en
 * la página, este script:
 *
 *   1. Recorre cada carpeta dentro de `src/assets/evidencias/`.
 *   2. Genera (o actualiza) un `manifest.json` con la lista de archivos
 *      que encontró (nombre, tamaño y extensión).
 *   3. La página de cada categoría (EvidenceCategoryPageComponent) lee
 *      ese `manifest.json` por HTTP y dibuja la lista de archivos.
 *
 * Se ejecuta automáticamente gracias a los scripts "prestart" y
 * "prebuild" definidos en package.json — no hay que llamarlo a mano,
 * aunque también se puede correr manualmente con:
 *
 *   npm run evidencias:index
 *
 * No usa dependencias externas a propósito (solo el "fs" de Node),
 * para no añadir peso ni configuración extra al proyecto.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const EVIDENCE_ROOT = path.join(__dirname, '..', 'src', 'assets', 'evidencias');

/** Nombres que nunca deben aparecer listados como "evidencia". */
const IGNORED_FILES = new Set(['manifest.json', '.gitkeep', '.ds_store', 'leeme.md', 'readme.md']);

/**
 * Convierte bytes a un texto legible (KB/MB), para mostrarlo en la UI
 * sin tener que hacer esa cuenta dentro de Angular.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Genera el manifest.json de una carpeta de categoría puntual.
 * @param {string} categorySlug nombre de la carpeta (ej: 'sql')
 */
function generateManifestFor(categorySlug) {
  const categoryDir = path.join(EVIDENCE_ROOT, categorySlug);
  const entries = fs.readdirSync(categoryDir, { withFileTypes: true });

  const files = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => !IGNORED_FILES.has(entry.name.toLowerCase()))
    .map((entry) => {
      const fullPath = path.join(categoryDir, entry.name);
      const stats = fs.statSync(fullPath);
      return {
        name: entry.name,
        url: `assets/evidencias/${categorySlug}/${encodeURIComponent(entry.name)}`,
        extension: path.extname(entry.name).replace('.', '').toLowerCase(),
        sizeBytes: stats.size,
        sizeLabel: formatBytes(stats.size)
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const manifest = {
    category: categorySlug,
    generatedAt: new Date().toISOString(),
    files
  };

  const manifestPath = path.join(categoryDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`[evidencias] ${categorySlug}: ${files.length} archivo(s) indexado(s).`);
}

function main() {
  if (!fs.existsSync(EVIDENCE_ROOT)) {
    console.warn(`[evidencias] No existe la carpeta ${EVIDENCE_ROOT}, no hay nada que indexar.`);
    return;
  }

  const categoryDirs = fs
    .readdirSync(EVIDENCE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const categorySlug of categoryDirs) {
    generateManifestFor(categorySlug);
  }
}

main();
