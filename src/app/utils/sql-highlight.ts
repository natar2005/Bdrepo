/**
 * Resaltado de sintaxis SQL pequeño y sin dependencias.
 * Recorre el texto una sola vez y lo parte en fragmentos (comentarios,
 * cadenas, números, palabras clave, funciones...). Devuelve una lista de
 * líneas, cada una con su HTML ya escapado, para pintarlas con números.
 */

const KEYWORDS = new Set(
  `ADD ALL ALTER AND ANY AS ASC AUTO_INCREMENT BEGIN BETWEEN BY CASCADE CASE CHARACTER CHARSET CHECK COLLATE COLUMN COMMIT
  CONSTRAINT CREATE CROSS DATABASE DEFAULT DELETE DESC DISTINCT DROP ELSE END ENGINE ENUM EXCEPT EXISTS FOREIGN FROM FULL
  GRANT GROUP HAVING IDENTIFIED IF IGNORE IN INDEX INNER INSERT INTERSECT INTO IS JOIN KEY LEFT LIKE LIMIT NATURAL NO NOT
  NULL OFFSET ON OR ORDER OUTER PRIMARY REFERENCES REPLACE RESTRICT REVOKE RIGHT ROLLBACK SAVEPOINT SELECT SET SHOW START
  TABLE TABLES THEN TO TRANSACTION TRIGGER UNION UNIQUE UPDATE USE USER USING VALUES VIEW WHEN WHERE WITH ACTION GRANTS
  FOR RECURSIVE OVER PARTITION WINDOW ROWS RANGE UNBOUNDED PRECEDING FOLLOWING CURRENT ROW NAMES`
    .split(/\s+/)
    .filter(Boolean)
);

const TYPES = new Set(
  `INT INTEGER BIGINT SMALLINT TINYINT MEDIUMINT DECIMAL NUMERIC FLOAT DOUBLE REAL BIT BOOLEAN BOOL CHAR VARCHAR TEXT
  TINYTEXT MEDIUMTEXT LONGTEXT DATE DATETIME TIMESTAMP TIME YEAR BLOB JSON UNSIGNED`
    .split(/\s+/)
    .filter(Boolean)
);

const LITERALS = new Set(['TRUE', 'FALSE', 'NULL']);

export interface HighlightedLine {
  html: string;
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(cls: string, text: string): string {
  // Un fragmento puede cruzar varias líneas (comentarios /* */ o cadenas):
  // se cierra y se vuelve a abrir el span en cada salto de línea.
  return text
    .split('\n')
    .map((part) => (part ? `<span class="tok-${cls}">${escape(part)}</span>` : ''))
    .join('\n');
}

export function highlightSql(source: string): HighlightedLine[] {
  let out = '';
  let i = 0;
  const n = source.length;

  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];

    // comentario de línea
    if ((ch === '-' && next === '-') || ch === '#') {
      const end = source.indexOf('\n', i);
      const stop = end === -1 ? n : end;
      out += wrap('comment', source.slice(i, stop));
      i = stop;
      continue;
    }
    // comentario de bloque
    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      out += wrap('comment', source.slice(i, stop));
      i = stop;
      continue;
    }
    // cadenas '...' o "..." (con comillas dobladas como escape)
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < n) {
        if (source[j] === '\\') {
          j += 2;
          continue;
        }
        if (source[j] === ch) {
          if (source[j + 1] === ch) {
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      out += wrap('string', source.slice(i, Math.min(j + 1, n)));
      i = j + 1;
      continue;
    }
    // identificadores con `backticks`
    if (ch === '`') {
      const end = source.indexOf('`', i + 1);
      const stop = end === -1 ? n : end + 1;
      out += wrap('ident', source.slice(i, stop));
      i = stop;
      continue;
    }
    // números
    if (/[0-9]/.test(ch) && !/[\w$]/.test(source[i - 1] ?? '')) {
      const m = /^[0-9]+(\.[0-9]+)?/.exec(source.slice(i));
      if (m) {
        out += wrap('number', m[0]);
        i += m[0].length;
        continue;
      }
    }
    // variables @x y @@x
    if (ch === '@') {
      const m = /^@@?[\w.]+/.exec(source.slice(i));
      if (m) {
        out += wrap('var', m[0]);
        i += m[0].length;
        continue;
      }
    }
    // palabras
    if (/[A-Za-z_À-ɏ]/.test(ch)) {
      const m = /^[\wÀ-ɏ$]+/.exec(source.slice(i))!;
      const word = m[0];
      const upper = word.toUpperCase();
      let rest = i + word.length;
      while (source[rest] === ' ') rest++;
      if (LITERALS.has(upper)) out += wrap('literal', word);
      else if (KEYWORDS.has(upper)) out += wrap('keyword', word);
      else if (TYPES.has(upper)) out += wrap('type', word);
      else if (source[rest] === '(') out += wrap('function', word);
      else out += escape(word);
      i += word.length;
      continue;
    }
    // operadores y puntuación
    if (/[=<>!+\-*/%|]/.test(ch)) {
      out += wrap('operator', ch);
      i++;
      continue;
    }
    if (/[(),;.]/.test(ch)) {
      out += wrap('punct', ch);
      i++;
      continue;
    }
    out += escape(ch);
    i++;
  }

  return out.split('\n').map((html) => ({ html }));
}

export interface SqlOutlineEntry {
  line: number;
  label: string;
}

/**
 * Índice del script: el primer renglón de cada bloque de comentarios que
 * va justo antes de una sentencia (sin contar el encabezado del archivo).
 */
export function sqlOutline(source: string): SqlOutlineEntry[] {
  const lines = source.split('\n');
  const entries: SqlOutlineEntry[] = [];
  let i = 0;
  // saltar el encabezado (primer bloque de comentarios)
  while (i < lines.length && (lines[i].trim() === '' || lines[i].trim().startsWith('--'))) {
    if (lines[i].trim() === '' && i > 0 && lines[i - 1].trim().startsWith('--')) break;
    i++;
  }
  for (; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed.startsWith('--') || (i > 0 && lines[i - 1].trim().startsWith('--'))) continue;
    // ¿el bloque de comentarios termina en una sentencia?
    let j = i;
    while (j < lines.length && lines[j].trim().startsWith('--')) j++;
    if (j >= lines.length || lines[j].trim() === '') continue;
    const label = trimmed.replace(/^--+\s*/, '').replace(/^-+\s*|\s*-+$/g, '').trim();
    if (label && /[A-Za-z0-9À-ɏ]/.test(label)) entries.push({ line: i + 1, label });
  }
  return entries;
}
