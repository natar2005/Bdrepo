#!/usr/bin/env node
/**
 * generate-evidence-manifest.js
 * ------------------------------------------------------------------
 * Angular, al compilar (`ng build`) o servir (`ng serve`) el proyecto,
 * solo puede mostrar contenido que ya existía en disco en ese momento:
 * no puede "listar una carpeta" del servidor en tiempo real porque el
 * resultado final es un sitio 100% estático.
 *
 * Para que baste con copiar archivos a una carpeta (por ejemplo
 * `src/assets/evidencias/sql/`) y que aparezcan solos en la página,
 * este script:
 *
 *   1. Recorre cada carpeta de categoría dentro de `src/assets/evidencias/`.
 *   2. Cada SUBCARPETA de una categoría es un grupo (por ejemplo
 *      `modelo/archiveludo/`). Los archivos sueltos de la categoría van en
 *      un grupo general.
 *   3. Si existe `catalogo.json` en la categoría, toma de ahí los títulos,
 *      descripciones, el orden y los adjuntos. Lo que no esté en el
 *      catálogo igual aparece, con un título armado desde el nombre.
 *   4. Busca portadas en `_portadas/` y vistas previas en `_vistas/`
 *      (por ejemplo el PDF de un .docx), dentro de la carpeta del grupo.
 *   5. Para cada Excel (.xlsx) genera `_vistas/<nombre>.json` con las
 *      hojas, para poder verlas en la página sin descargarlas.
 *   6. Para cada script .sql lee el comentario del inicio y saca el
 *      título y la descripción.
 *   7. Escribe el `manifest.json` de la categoría, que es lo que lee
 *      EvidenceCategoryPageComponent.
 *
 * Se ejecuta automáticamente gracias a los scripts "prestart" y
 * "prebuild" definidos en package.json, aunque también se puede correr
 * manualmente con:
 *
 *   npm run evidencias:index
 *
 * No usa dependencias externas a propósito (solo "fs", "path" y "zlib"
 * de Node), para no añadir peso ni configuración extra al proyecto.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { xlsxToPreview } = require('./xlsx-preview');

const EVIDENCE_ROOT = path.join(__dirname, '..', 'src', 'assets', 'evidencias');
const PUBLIC_BASE = 'assets/evidencias';

/** Nombres que nunca deben aparecer listados como "evidencia". */
const IGNORED_FILES = new Set(['manifest.json', 'catalogo.json', '.gitkeep', '.ds_store', 'thumbs.db', 'desktop.ini', 'leeme.md', 'readme.md']);
const COVER_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png'];

const KINDS = {
  image: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'],
  pdf: ['pdf'],
  document: ['doc', 'docx', 'odt', 'ppt', 'pptx', 'odp', 'txt', 'md'],
  sheet: ['xls', 'xlsx', 'ods', 'csv'],
  sql: ['sql'],
  archive: ['zip', 'rar', '7z'],
  video: ['mp4', 'webm', 'mov']
};

// ------------------------------------------------------------------ utilidades

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

function kindOf(extension) {
  for (const [kind, list] of Object.entries(KINDS)) {
    if (list.includes(extension)) return kind;
  }
  return 'other';
}

/** URL pública con cada parte del camino codificada (espacios, tildes, #...). */
function publicUrl(...parts) {
  return [PUBLIC_BASE, ...parts.filter(Boolean)]
    .join('/')
    .split('/')
    .map((segment, i) => (i < 2 ? segment : encodeURIComponent(segment)))
    .join('/');
}

/** "02-reduccion-a-tablas_v2.png" -> "Reduccion a tablas v2" */
function titleFromName(fileName) {
  const base = fileName.replace(/\.[^.]+$/, '');
  const clean = base.replace(/^\d+[\s._-]*/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || base;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function readCatalog(categoryDir) {
  const file = path.join(categoryDir, 'catalogo.json');
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.warn(`[evidencias] ${file} tiene un error de formato y se ignoró: ${err.message}`);
    return {};
  }
}

function isVisibleEntry(name) {
  return !name.startsWith('.') && !name.startsWith('_') && !IGNORED_FILES.has(name.toLowerCase());
}

/** Busca `<carpeta>/<sub>/<base>.<ext>` para alguna de las extensiones dadas. */
function findCompanion(dir, sub, base, extensions) {
  for (const ext of extensions) {
    const candidate = path.join(dir, sub, `${base}.${ext}`);
    if (fs.existsSync(candidate)) return `${sub}/${base}.${ext}`;
  }
  return null;
}

// ------------------------------------------------------------------ tamaño de imágenes

function imageSize(file, extension) {
  try {
    const fd = fs.openSync(file, 'r');
    const head = Buffer.alloc(64 * 1024);
    const read = fs.readSync(fd, head, 0, head.length, 0);
    fs.closeSync(fd);
    const buf = head.subarray(0, read);
    if (extension === 'png' && buf.readUInt32BE(12) === 0x49484452) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (extension === 'gif') {
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
    if (extension === 'webp' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = buf.toString('ascii', 12, 16);
      if (chunk === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
      if (chunk === 'VP8L') {
        const bits = buf.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (extension === 'jpg' || extension === 'jpeg') {
      let offset = 2;
      while (offset < buf.length - 9) {
        if (buf[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = buf[offset + 1];
        const length = buf.readUInt16BE(offset + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { width: buf.readUInt16BE(offset + 7), height: buf.readUInt16BE(offset + 5) };
        }
        offset += 2 + length;
      }
    }
  } catch (err) {
    // si no se puede leer, la página usa una proporción por defecto
  }
  return null;
}

// ------------------------------------------------------------------ SQL

/**
 * Lee el bloque de comentarios del inicio de un script, por ejemplo:
 *   -- Apuntes 01: selección (σ), proyección (π), renombrado (ρ)
 *   -- σ -> WHERE | π -> lista de columnas del SELECT | ρ -> AS
 * y devuelve { title, description }.
 */
function sqlHeader(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const header = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) header.push(trimmed.replace(/^--+\s?/, '').trim());
    else if (trimmed === '' && header.length === 0) continue;
    else break;
  }
  let title = null;
  let titleIndex = -1;
  for (let i = 0; i < header.length; i++) {
    const m = header[i].match(/^(?:apuntes\s*)?(\d+)?\s*:\s*(.+)$/i);
    if (m && (m[1] || /^apuntes/i.test(header[i]))) {
      title = capitalize(m[2].trim());
      titleIndex = i;
      break;
    }
  }
  const description = header.slice(titleIndex + 1).filter(Boolean).join('\n');
  return { title, description, lines: lines.length };
}

// ------------------------------------------------------------------ archivos

function describeFile(categorySlug, groupDir, groupSlug, fileName, meta) {
  const fullPath = path.join(groupDir, fileName);
  const stats = fs.statSync(fullPath);
  const extension = path.extname(fileName).replace('.', '').toLowerCase();
  const base = fileName.replace(/\.[^.]+$/, '');
  const kind = kindOf(extension);
  const rel = (p) => publicUrl(categorySlug, groupSlug, p);

  const file = {
    name: fileName,
    url: rel(fileName),
    extension,
    kind,
    sizeBytes: stats.size,
    sizeLabel: formatBytes(stats.size),
    title: meta.titulo || null,
    description: meta.descripcion || null
  };
  if (meta.etiqueta) file.tag = meta.etiqueta;
  if (meta.destacado) file.featured = true;

  const cover = findCompanion(groupDir, '_portadas', base, COVER_EXTENSIONS);
  if (cover) file.cover = rel(cover);
  else if (kind === 'image') file.cover = file.url;

  if (kind === 'image') {
    const size = imageSize(fullPath, extension);
    if (size) Object.assign(file, size);
  }

  if (kind === 'document') {
    const preview = findCompanion(groupDir, '_vistas', base, ['pdf']);
    if (preview) file.preview = rel(preview);
  }

  if (kind === 'sql') {
    const header = sqlHeader(fullPath);
    file.title = file.title || header.title;
    file.description = file.description || header.description || null;
    file.lines = header.lines;
    const number = fileName.match(/^(\d+)/);
    if (number) file.number = number[1].padStart(2, '0');
  }

  if (extension === 'xlsx') {
    try {
      const preview = xlsxToPreview(fs.readFileSync(fullPath));
      const names = meta.hojas || {};
      for (const sheet of preview.sheets) sheet.title = names[sheet.name] || sheet.name;
      const viewsDir = path.join(groupDir, '_vistas');
      fs.mkdirSync(viewsDir, { recursive: true });
      fs.writeFileSync(path.join(viewsDir, `${base}.json`), JSON.stringify(preview) + '\n', 'utf8');
      file.sheet = rel(`_vistas/${base}.json`);
      file.sheetNames = preview.sheets.map((s) => s.title);
    } catch (err) {
      console.warn(`[evidencias] No se pudo leer ${fileName}: ${err.message}`);
    }
  }

  file.title = file.title || titleFromName(fileName);
  file.downloadName = kind === 'sql' ? fileName : `${file.title.replace(/[\\/:*?"<>|]+/g, '-')}.${extension}`;
  return file;
}

function sortByCatalog(names, catalogFiles) {
  const order = Object.keys(catalogFiles || {});
  return [...names].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
    return a.localeCompare(b, 'es', { numeric: true });
  });
}

function buildGroup(categorySlug, categoryDir, groupSlug, groupMeta) {
  const groupDir = groupSlug ? path.join(categoryDir, groupSlug) : categoryDir;
  const catalogFiles = groupMeta.archivos || {};
  const names = fs
    .readdirSync(groupDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isVisibleEntry(entry.name))
    .map((entry) => entry.name);

  // los adjuntos no salen como tarjeta propia: se muestran dentro de su archivo
  const attachmentNames = new Set();
  for (const meta of Object.values(catalogFiles)) {
    for (const name of meta.adjuntos || []) attachmentNames.add(name);
  }

  const files = sortByCatalog(names.filter((n) => !attachmentNames.has(n)), catalogFiles).map((name) => {
    const meta = catalogFiles[name] || {};
    const file = describeFile(categorySlug, groupDir, groupSlug, name, meta);
    const attachments = (meta.adjuntos || []).filter((a) => names.includes(a));
    if (attachments.length) {
      file.attachments = attachments.map((a) => {
        const attachmentMeta = catalogFiles[a] || {};
        const described = describeFile(categorySlug, groupDir, groupSlug, a, attachmentMeta);
        return {
          name: described.name,
          url: described.url,
          extension: described.extension,
          sizeLabel: described.sizeLabel,
          title: attachmentMeta.titulo || described.title,
          downloadName: described.downloadName
        };
      });
    }
    return file;
  });

  return {
    slug: groupSlug || 'general',
    // "titulo": "" en el catálogo deja el grupo sin encabezado
    title: 'titulo' in groupMeta ? groupMeta.titulo || null : groupSlug ? titleFromName(groupSlug) : null,
    description: groupMeta.descripcion || null,
    files
  };
}

function buildRelated(entries) {
  const related = [];
  for (const entry of entries || []) {
    const parts = (entry.ruta || '').split('/').filter(Boolean);
    if (parts.length < 2) continue;
    const [categorySlug, ...rest] = parts;
    const fileName = rest.pop();
    const groupSlug = rest.join('/');
    const groupDir = path.join(EVIDENCE_ROOT, categorySlug, ...rest);
    if (!fs.existsSync(path.join(groupDir, fileName))) {
      console.warn(`[evidencias] El relacionado "${entry.ruta}" no existe y se omitió.`);
      continue;
    }
    const file = describeFile(categorySlug, groupDir, groupSlug, fileName, entry);
    file.category = categorySlug;
    related.push(file);
  }
  return related;
}

/**
 * Genera el manifest.json de una carpeta de categoría puntual.
 * @param {string} categorySlug nombre de la carpeta (ej: 'sql')
 */
function generateManifestFor(categorySlug) {
  const categoryDir = path.join(EVIDENCE_ROOT, categorySlug);
  const catalog = readCatalog(categoryDir);
  const catalogGroups = catalog.grupos || [];

  const subfolders = fs
    .readdirSync(categoryDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isVisibleEntry(entry.name))
    .map((entry) => entry.name);

  const groupSlugs = [];
  for (const g of catalogGroups) {
    const slug = g.carpeta || '';
    if (slug === '' || subfolders.includes(slug)) groupSlugs.push(slug);
  }
  if (!groupSlugs.includes('')) groupSlugs.unshift('');
  for (const folder of subfolders.sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))) {
    if (!groupSlugs.includes(folder)) groupSlugs.push(folder);
  }

  const groups = groupSlugs
    .map((slug) => buildGroup(categorySlug, categoryDir, slug, catalogGroups.find((g) => (g.carpeta || '') === slug) || {}))
    .filter((group) => group.files.length > 0);

  const files = groups.flatMap((group) => group.files);

  const manifest = {
    category: categorySlug,
    generatedAt: new Date().toISOString(),
    intro: catalog.introduccion || null,
    groups,
    related: buildRelated(catalog.relacionados),
    files
  };

  const manifestPath = path.join(categoryDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`[evidencias] ${categorySlug}: ${files.length} archivo(s) en ${groups.length} grupo(s).`);
}

function main() {
  if (!fs.existsSync(EVIDENCE_ROOT)) {
    console.warn(`[evidencias] No existe la carpeta ${EVIDENCE_ROOT}, no hay nada que indexar.`);
    return;
  }

  const categoryDirs = fs
    .readdirSync(EVIDENCE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isVisibleEntry(entry.name))
    .map((entry) => entry.name);

  for (const categorySlug of categoryDirs) {
    generateManifestFor(categorySlug);
  }
}

main();
