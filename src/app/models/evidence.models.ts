/**
 * Forma de los manifest.json que genera scripts/generate-evidence-manifest.js
 * y de las vistas previas de Excel (_vistas/<nombre>.json).
 */

export type EvidenceKind = 'image' | 'pdf' | 'document' | 'sheet' | 'sql' | 'archive' | 'video' | 'other';

export interface EvidenceAttachment {
  name: string;
  url: string;
  extension: string;
  sizeLabel: string;
  title: string;
  downloadName: string;
}

export interface EvidenceFile {
  name: string;
  url: string;
  extension: string;
  kind: EvidenceKind;
  sizeBytes: number;
  sizeLabel: string;
  title: string;
  description: string | null;
  downloadName: string;
  tag?: string;
  featured?: boolean;
  /** Miniatura (portada del PDF o versión pequeña de la imagen). */
  cover?: string;
  /** PDF para ver en la página un documento de Word. */
  preview?: string;
  /** JSON con las hojas de un Excel. */
  sheet?: string;
  sheetNames?: string[];
  width?: number;
  height?: number;
  /** Solo en scripts .sql */
  number?: string;
  lines?: number;
  attachments?: EvidenceAttachment[];
  /** Solo en los relacionados: categoría de donde viene el archivo. */
  category?: string;
}

export interface EvidenceGroup {
  slug: string;
  title: string | null;
  description: string | null;
  files: EvidenceFile[];
}

export interface EvidenceManifest {
  category: string;
  generatedAt: string;
  intro?: string | null;
  groups?: EvidenceGroup[];
  related?: EvidenceFile[];
  files: EvidenceFile[];
}

// ------------------------------------------------------------- Excel

/** Estilo compacto de una celda (ver cssFor en scripts/xlsx-preview.js). */
export interface SheetCellStyle {
  b?: 1;
  i?: 1;
  u?: 1;
  s?: 1;
  c?: string;
  fs?: number;
  bg?: string;
  ha?: string;
  va?: string;
  w?: 1;
  bt?: string;
  br?: string;
  bb?: string;
  bl?: string;
}

/** [fila, columna, texto, estilo, filasCombinadas?, columnasCombinadas?] */
export type SheetCell = [number, number, string, number, number?, number?];

export interface GuidedColumn {
  name: string;
  key: boolean;
  fk: boolean;
}

export interface GuidedTable {
  name: string;
  columns: GuidedColumn[];
}

export interface GuidedStep {
  label: string | null;
  tables: GuidedTable[];
  details: { title: string; text: string }[];
}

export interface GuidedSection {
  title: string | null;
  steps: GuidedStep[];
}

export interface SheetPreview {
  name: string;
  title: string;
  rows: number;
  cols: number;
  colWidths: number[];
  rowHeights: number[];
  styles: SheetCellStyle[];
  cells: SheetCell[];
  guided: { stepColumns: string[]; sections: GuidedSection[] } | null;
}

export interface WorkbookPreview {
  sheets: SheetPreview[];
}

/** Nombre corto del tipo de archivo para mostrar en las tarjetas. */
export function kindLabel(file: Pick<EvidenceFile, 'kind' | 'extension'>): string {
  switch (file.kind) {
    case 'image':
      return 'Imagen';
    case 'pdf':
      return 'PDF';
    case 'document':
      return file.extension.startsWith('ppt') ? 'Presentación' : 'Word';
    case 'sheet':
      return 'Excel';
    case 'sql':
      return 'SQL';
    case 'archive':
      return 'ZIP';
    case 'video':
      return 'Video';
    default:
      return file.extension.toUpperCase() || 'Archivo';
  }
}

/** Si el archivo se puede abrir dentro de la página (imagen o PDF). */
export function canPreview(file: EvidenceFile): boolean {
  return file.kind === 'image' || file.kind === 'pdf' || !!file.preview;
}
