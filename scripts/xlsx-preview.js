'use strict';
/**
 * xlsx-preview.js
 * ------------------------------------------------------------------
 * Convierte un archivo de Excel (.xlsx) en un JSON que la página de
 * Normalización puede dibujar: valores, estilos (negrita, subrayado,
 * rellenos, bordes), celdas combinadas y tamaños de filas y columnas.
 *
 * Además intenta leer la hoja "paso a paso": busca las tablas (un
 * título con borde y debajo sus atributos), los rótulos tipo
 * "Esquema en 3FN" o "PASO 1:" y la "TABLA DE PASOS" con las
 * explicaciones de cada paso.
 *
 * Igual que el script de evidencias, no usa dependencias: un .xlsx es
 * un .zip con archivos XML, así que basta con `zlib` de Node.
 */

const zlib = require('zlib');

// ------------------------------------------------------------------ zip

function openZip(buffer) {
  let eocd = -1;
  const stop = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= stop; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('El archivo no parece un .xlsx válido.');

  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let n = 0; n < count; n++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    entries.set(name, { method, compressedSize, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return {
    read(name) {
      const entry = entries.get(name.replace(/^\//, ''));
      if (!entry) return null;
      const localName = buffer.readUInt16LE(entry.localOffset + 26);
      const localExtra = buffer.readUInt16LE(entry.localOffset + 28);
      const start = entry.localOffset + 30 + localName + localExtra;
      const data = buffer.subarray(start, start + entry.compressedSize);
      if (entry.method === 0) return data.toString('utf8');
      if (entry.method === 8) return zlib.inflateRawSync(data).toString('utf8');
      throw new Error(`Compresión no soportada en ${name}`);
    }
  };
}

// ------------------------------------------------------------------ xml

function attrs(tag) {
  const out = {};
  const re = /([\w:]+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(tag))) out[m[1]] = decode(m[2]);
  return out;
}

function decode(text) {
  return text
    .replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function section(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1] : '';
}

/** Lista de elementos <tag ...>...</tag> o <tag .../> (sin anidar el mismo tag). */
function elements(xml, tag) {
  const out = [];
  const re = new RegExp(`<${tag}(\\s[^>]*?)?(?:/>|>([\\s\\S]*?)</${tag}>)`, 'g');
  let m;
  while ((m = re.exec(xml))) out.push({ attrs: attrs(m[1] || ''), body: m[2] || '' });
  return out;
}

function child(body, tag) {
  const m = body.match(new RegExp(`<${tag}(\\s[^>]*?)?/?>`));
  return m ? attrs(m[1] || '') : null;
}

// ------------------------------------------------------------------ colores

const INDEXED = [
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
  '800000', '008000', '000080', '808000', '800080', '008080', 'C0C0C0', '808080',
  '9999FF', '993366', 'FFFFCC', 'CCFFFF', '660066', 'FF8080', '0066CC', 'CCCCFF',
  '000080', 'FF00FF', 'FFFF00', '00FFFF', '800080', '800000', '008080', '0000FF',
  '00CCFF', 'CCFFFF', 'CCFFCC', 'FFFF99', '99CCFF', 'FF99CC', 'CC99FF', 'FFCC99',
  '3366FF', '33CCCC', '99CC00', 'FFCC00', 'FF9900', 'FF6600', '666699', '969696',
  '003366', '339966', '003300', '333300', '993300', '993366', '333399', '333333'
];

function readTheme(xml) {
  if (!xml) return [];
  const scheme = section(xml, 'a:clrScheme');
  const order = ['lt1', 'dk1', 'lt2', 'dk2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
  return order.map((name) => {
    const body = section(scheme, `a:${name}`);
    const srgb = body.match(/srgbClr val="([0-9A-Fa-f]{6})"/);
    const sys = body.match(/lastClr="([0-9A-Fa-f]{6})"/);
    return (srgb && srgb[1]) || (sys && sys[1]) || '000000';
  });
}

function applyTint(hex, tint) {
  if (!tint) return hex;
  let r = parseInt(hex.slice(0, 2), 16) / 255;
  let g = parseInt(hex.slice(2, 4), 16) / 255;
  let b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  l = tint < 0 ? l * (1 + tint) : l * (1 - tint) + tint;
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  const to = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

function resolveColor(color, theme) {
  if (!color) return null;
  let hex = null;
  if (color.rgb) hex = color.rgb.slice(-6);
  else if (color.theme !== undefined) hex = theme[Number(color.theme)] || null;
  else if (color.indexed !== undefined) hex = INDEXED[Number(color.indexed)] || null;
  if (!hex) return null;
  return `#${applyTint(hex.toUpperCase(), color.tint ? Number(color.tint) : 0)}`;
}

// ------------------------------------------------------------------ estilos

function readStyles(xml, theme) {
  if (!xml) return [];
  const fonts = elements(section(xml, 'fonts'), 'font').map(({ body }) => {
    const flag = (tag) => {
      const a = child(body, tag);
      return !!a && a.val !== '0' && a.val !== 'false' && a.val !== 'none';
    };
    const size = child(body, 'sz');
    return {
      bold: flag('b'),
      italic: flag('i'),
      underline: flag('u'),
      strike: flag('strike'),
      size: size ? Number(size.val) : 11,
      color: resolveColor(child(body, 'color'), theme)
    };
  });

  const fills = elements(section(xml, 'fills'), 'fill').map(({ body }) => {
    const pattern = child(body, 'patternFill');
    if (!pattern || !pattern.patternType || pattern.patternType === 'none') return null;
    return resolveColor(child(body, 'fgColor'), theme) || resolveColor(child(body, 'bgColor'), theme);
  });

  const borders = elements(section(xml, 'borders'), 'border').map(({ body }) => {
    const side = (name) => {
      const m = body.match(new RegExp(`<${name}(\\s[^>]*?)?(?:/>|>([\\s\\S]*?)</${name}>)`));
      if (!m) return null;
      const a = attrs(m[1] || '');
      if (!a.style) return null;
      const color = resolveColor(child(m[2] || '', 'color'), theme) || '#000000';
      const width = /medium|thick|double/.test(a.style) ? (a.style === 'thick' ? 3 : 2) : 1;
      const line = /dash|dot/i.test(a.style) ? 'dashed' : (a.style === 'double' ? 'double' : 'solid');
      return `${width}px ${line} ${color}`;
    };
    return { top: side('top'), right: side('right'), bottom: side('bottom'), left: side('left') };
  });

  return elements(section(xml, 'cellXfs'), 'xf').map(({ attrs: a, body }) => {
    const align = child(body, 'alignment') || {};
    return {
      font: fonts[Number(a.fontId || 0)] || fonts[0] || {},
      fill: fills[Number(a.fillId || 0)] || null,
      border: borders[Number(a.borderId || 0)] || {},
      h: align.horizontal || null,
      v: align.vertical || 'bottom',
      wrap: align.wrapText === '1' || align.wrapText === 'true'
    };
  });
}

/** Estilo compacto (en claves cortas) que entiende el componente de Angular. */
function cssFor(xf, borderOverride) {
  if (!xf) return {};
  const css = {};
  const f = xf.font || {};
  if (f.bold) css.b = 1;
  if (f.italic) css.i = 1;
  if (f.underline) css.u = 1;
  if (f.strike) css.s = 1;
  if (f.color && f.color !== '#000000') css.c = f.color;
  if (f.size && f.size !== 11) css.fs = f.size;
  if (xf.fill) css.bg = xf.fill;
  if (xf.h && xf.h !== 'general') css.ha = xf.h;
  if (xf.v) css.va = xf.v === 'center' ? 'middle' : xf.v;
  if (xf.wrap) css.w = 1;
  const b = borderOverride || xf.border || {};
  if (b.top) css.bt = b.top;
  if (b.right) css.br = b.right;
  if (b.bottom) css.bb = b.bottom;
  if (b.left) css.bl = b.left;
  return css;
}

// ------------------------------------------------------------------ hojas

function colIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function parseRef(ref) {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  return { r: Number(m[2]), c: colIndex(m[1]) };
}

function numberText(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return String(Math.round(n * 1e10) / 1e10);
}

function readSheet(xml, shared, xfs) {
  const cells = new Map();
  const rowHeights = {};
  let maxRow = 0;
  let maxCol = 0;

  const fmt = xml.match(/<sheetFormatPr[^>]*>/);
  const fmtAttrs = fmt ? attrs(fmt[0]) : {};
  const defaultRowHeight = Number(fmtAttrs.defaultRowHeight || 15);
  const defaultColWidth = Number(fmtAttrs.defaultColWidth || 8.43);

  const colWidths = {};
  for (const { attrs: a } of elements(section(xml, 'cols'), 'col')) {
    if (a.hidden === '1') continue;
    for (let c = Number(a.min); c <= Number(a.max); c++) colWidths[c] = Number(a.width);
  }

  for (const row of elements(section(xml, 'sheetData'), 'row')) {
    const r = Number(row.attrs.r);
    if (row.attrs.ht) rowHeights[r] = Number(row.attrs.ht);
    for (const cell of elements(row.body, 'c')) {
      const { r: rr, c } = parseRef(cell.attrs.r);
      const type = cell.attrs.t;
      const v = cell.body.match(/<v>([\s\S]*?)<\/v>/);
      let text = '';
      if (type === 's' && v) text = shared[Number(v[1])] || '';
      else if (type === 'inlineStr') text = [...cell.body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join('');
      else if (type === 'b' && v) text = v[1] === '1' ? 'VERDADERO' : 'FALSO';
      else if (type === 'str' || type === 'e') text = v ? decode(v[1]) : '';
      else if (v) text = numberText(v[1]);
      const style = Number(cell.attrs.s || 0);
      const xf = xfs[style];
      const visible = text !== '' || (xf && (xf.fill || Object.values(xf.border || {}).some(Boolean)));
      if (!visible) continue;
      cells.set(`${rr}:${c}`, { r: rr, c, text, xf });
      maxRow = Math.max(maxRow, rr);
      maxCol = Math.max(maxCol, c);
    }
  }

  const merges = elements(section(xml, 'mergeCells'), 'mergeCell').map(({ attrs: a }) => {
    const [from, to] = a.ref.split(':');
    const p = parseRef(from);
    const q = parseRef(to || from);
    maxRow = Math.max(maxRow, q.r);
    maxCol = Math.max(maxCol, q.c);
    return { r1: p.r, c1: p.c, r2: q.r, c2: q.c };
  });

  return { cells, merges, rowHeights, colWidths, defaultRowHeight, defaultColWidth, maxRow, maxCol };
}

/** Pasa la hoja leída a la forma compacta del JSON (con estilos deduplicados). */
function serializeSheet(name, sheet) {
  const styleKeys = new Map();
  const styles = [];
  const styleIndex = (css) => {
    const key = JSON.stringify(css);
    if (!styleKeys.has(key)) {
      styleKeys.set(key, styles.length);
      styles.push(css);
    }
    return styleKeys.get(key);
  };

  const mergeAt = new Map();
  for (const m of sheet.merges) mergeAt.set(`${m.r1}:${m.c1}`, m);

  const cells = [];
  const covered = new Set();
  for (const m of sheet.merges) {
    for (let r = m.r1; r <= m.r2; r++) {
      for (let c = m.c1; c <= m.c2; c++) {
        if (r !== m.r1 || c !== m.c1) covered.add(`${r}:${c}`);
      }
    }
  }

  for (const cell of [...sheet.cells.values()].sort((a, b) => a.r - b.r || a.c - b.c)) {
    if (covered.has(`${cell.r}:${cell.c}`)) continue;
    const merge = mergeAt.get(`${cell.r}:${cell.c}`);
    let border = null;
    if (merge) {
      const edge = (r, c) => (sheet.cells.get(`${r}:${c}`)?.xf?.border) || {};
      border = {
        top: edge(merge.r1, merge.c1).top || null,
        left: edge(merge.r1, merge.c1).left || null,
        right: edge(merge.r1, merge.c2).right || null,
        bottom: edge(merge.r2, merge.c1).bottom || null
      };
    }
    const entry = [cell.r, cell.c, cell.text, styleIndex(cssFor(cell.xf, border))];
    if (merge) entry.push(merge.r2 - merge.r1 + 1, merge.c2 - merge.c1 + 1);
    cells.push(entry);
  }
  // celdas combinadas cuya esquina superior izquierda no tenía contenido ni estilo
  for (const m of sheet.merges) {
    if (!sheet.cells.has(`${m.r1}:${m.c1}`)) {
      cells.push([m.r1, m.c1, '', styleIndex({}), m.r2 - m.r1 + 1, m.c2 - m.c1 + 1]);
    }
  }
  cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const colWidths = [];
  for (let c = 1; c <= sheet.maxCol; c++) {
    const w = sheet.colWidths[c] ?? sheet.defaultColWidth;
    colWidths.push(Math.round(w * 7 + 5));
  }
  const rowHeights = [];
  for (let r = 1; r <= sheet.maxRow; r++) {
    rowHeights.push(Math.round((sheet.rowHeights[r] ?? sheet.defaultRowHeight) * (96 / 72)));
  }

  return { name, rows: sheet.maxRow, cols: sheet.maxCol, colWidths, rowHeights, styles, cells };
}

// ------------------------------------------------------------------ paso a paso

function hasBorder(cell) {
  const b = cell?.xf?.border || {};
  return !!(b.top || b.right || b.bottom || b.left);
}

function isKey(cell) {
  const fill = (cell?.xf?.fill || '').toUpperCase();
  return !!(cell?.xf?.font?.underline) || fill === '#FFFF00';
}

/**
 * Lee la estructura de la normalización a partir de la posición de las
 * celdas. Si la hoja no sigue ese formato devuelve null y la página solo
 * muestra la hoja original.
 */
function guidedView(sheet) {
  const get = (r, c) => sheet.cells.get(`${r}:${c}`);
  const mergeOf = (r, c) => sheet.merges.find((m) => m.r1 === r && m.c1 === c) || { r1: r, c1: c, r2: r, c2: c };
  const used = new Set();

  // 1. "TABLA DE PASOS": encabezados + una fila por paso
  const explanations = new Map();
  let stepColumns = [];
  const stepsTitle = [...sheet.cells.values()].find((cell) => /tabla\s+de\s+pasos/i.test(cell.text));
  if (stepsTitle) {
    const tm = mergeOf(stepsTitle.r, stepsTitle.c);
    for (let r = tm.r1; r <= tm.r2; r++) for (let c = tm.c1; c <= tm.c2; c++) used.add(`${r}:${c}`);
    const headerRow = tm.r2 + 1;
    let c = stepsTitle.c;
    while (get(headerRow, c)?.text) {
      stepColumns.push({ c, title: get(headerRow, c).text.trim() });
      used.add(`${headerRow}:${c}`);
      c++;
    }
    let r = headerRow + 1;
    while (stepColumns.length && get(r, stepsTitle.c)?.text) {
      const label = get(r, stepsTitle.c).text.trim();
      const details = stepColumns.slice(1).map((col) => ({ title: col.title, text: (get(r, col.c)?.text || '').trim() })).filter((d) => d.text);
      explanations.set(normalizeLabel(label), details);
      for (const col of stepColumns) used.add(`${r}:${col.c}`);
      r++;
    }
  }

  // 2. Tablas (título con borde + fila de atributos con borde) y rótulos
  const items = [];
  const ordered = [...sheet.cells.values()].sort((a, b) => a.r - b.r || a.c - b.c);
  for (const cell of ordered) {
    const key = `${cell.r}:${cell.c}`;
    if (used.has(key) || !cell.text.trim()) continue;
    const m = mergeOf(cell.r, cell.c);
    const below = get(m.r2 + 1, cell.c);
    if (hasBorder(cell) && below && below.text && hasBorder(below)) {
      const columns = [];
      const lastCol = m.c2 > m.c1 ? m.c2 : Infinity;
      for (let c = cell.c; c <= lastCol; c++) {
        const attr = get(m.r2 + 1, c);
        if (!attr || !attr.text.trim()) {
          if (lastCol === Infinity) break;
          continue;
        }
        const raw = attr.text.trim();
        columns.push({ name: raw.replace(/\*+$/, '').trim(), key: isKey(attr), fk: /\*$/.test(raw) });
        used.add(`${m.r2 + 1}:${c}`);
      }
      for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) used.add(`${r}:${c}`);
      items.push({ type: 'table', r: cell.r, c: cell.c, name: cell.text.trim(), columns });
    } else {
      used.add(key);
      items.push({ type: 'label', r: cell.r, c: cell.c, text: cell.text.trim() });
    }
  }

  const tables = items.filter((i) => i.type === 'table');
  if (!tables.length) return null;

  const sections = [];
  let currentSection = null;
  let currentStep = null;
  const ensureSection = () => {
    if (!currentSection) {
      currentSection = { title: null, steps: [] };
      sections.push(currentSection);
    }
    return currentSection;
  };
  for (const item of items) {
    if (item.type === 'label') {
      if (/^paso\s*\d+/i.test(item.text)) {
        const label = item.text.replace(/:\s*$/, '').trim();
        currentStep = { label, tables: [], details: explanations.get(normalizeLabel(label)) || [] };
        ensureSection().steps.push(currentStep);
      } else {
        currentSection = { title: item.text.replace(/\s+/g, ' ').replace(/\s*\(/, ' (').trim(), steps: [] };
        sections.push(currentSection);
        currentStep = null;
      }
    } else {
      if (!currentStep) {
        currentStep = { label: null, tables: [], details: [] };
        ensureSection().steps.push(currentStep);
      }
      currentStep.tables.push({ name: item.name, columns: item.columns });
    }
  }

  return {
    stepColumns: stepColumns.map((col) => col.title),
    sections: sections.filter((s) => s.steps.some((st) => st.tables.length))
  };
}

function normalizeLabel(label) {
  return label.replace(/[:\s]/g, '').toUpperCase();
}

// ------------------------------------------------------------------ api

/**
 * @param {Buffer} buffer contenido del .xlsx
 * @returns {{ sheets: object[] }}
 */
function xlsxToPreview(buffer) {
  const zip = openZip(buffer);
  const workbook = zip.read('xl/workbook.xml');
  if (!workbook) throw new Error('Falta xl/workbook.xml');
  const rels = zip.read('xl/_rels/workbook.xml.rels') || '';
  const relTargets = new Map(elements(rels, 'Relationship').map(({ attrs: a }) => [a.Id, a.Target]));

  const sharedXml = zip.read('xl/sharedStrings.xml') || '';
  const shared = elements(sharedXml, 'si').map(({ body }) =>
    [...body.replace(/<rPh[\s\S]*?<\/rPh>/g, '').matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join('')
  );
  const theme = readTheme(zip.read('xl/theme/theme1.xml'));
  const xfs = readStyles(zip.read('xl/styles.xml'), theme);

  const sheets = [];
  for (const { attrs: a } of elements(section(workbook, 'sheets'), 'sheet')) {
    if (a.state === 'hidden' || a.state === 'veryHidden') continue;
    let target = relTargets.get(a['r:id']) || '';
    target = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
    const xml = zip.read(target);
    if (!xml) continue;
    const sheet = readSheet(xml, shared, xfs);
    const data = serializeSheet(a.name, sheet);
    let guided = null;
    try {
      guided = guidedView(sheet);
    } catch (err) {
      guided = null;
    }
    sheets.push({ ...data, guided });
  }
  return { sheets };
}

module.exports = { xlsxToPreview };
