/**
 * Menú de categorías de evidencias de Bases de Datos.
 */

export type EvidenceIconKey = 'model' | 'normalization' | 'sql' | 'research' | 'project';

export interface EvidenceCategory {
  /** Nombre de carpeta y segmento de URL*/
  slug: string;
  /** Título mostrado en la UI */
  title: string;
  /** Texto corto que explica qué contiene la categoría. */
  description: string;
  /** Icono, bordes, detalles de la categoría. */
  accentColor: string;
  /** Icono ilustrativo relacionado con el tema . */
  icon: EvidenceIconKey;
  /** Si debe ocupar el ancho completo en la grilla de la home. */
  wide?: boolean;
}

export const EVIDENCE_CATEGORIES: readonly EvidenceCategory[] = [
  {
    slug: 'modelo',
    title: 'Modelo',
    description: 'Modelos entidad-relación y diagramas de las bases de datos del curso.',
    accentColor: '#10a26a',
    icon: 'model'
  },
  {
    slug: 'normalizacion',
    title: 'Normalización',
    description: 'Proceso de normalización aplicado a cada modelo, forma a forma.',
    accentColor: '#e7b25f',
    icon: 'normalization'
  },
  {
    slug: 'sql',
    title: 'SQL',
    description: 'Scripts, consultas y ejercicios SQL desarrollados en el curso.',
    accentColor: '#d97757',
    icon: 'sql'
  },
  {
    slug: 'investigacion',
    title: 'Investigación',
    description: 'Investigaciones y lecturas complementarias sobre bases de datos.',
    accentColor: '#7fe3b8',
    icon: 'research'
  },
  {
    slug: 'proyecto',
    title: 'Proyecto',
    description: 'Avances y entregas del proyecto final del curso.',
    accentColor: '#0b6e4f',
    icon: 'project',
    wide: true
  }
] as const;

/** Carpeta base (dentro de src/assets) donde vive cada categoría de evidencias. */
export const EVIDENCE_ASSETS_BASE = 'assets/evidencias';

/** Devuelve la ruta pública (servida por el navegador) de la carpeta de una categoría. */
export function evidenceFolderUrl(slug: string): string {
  return `${EVIDENCE_ASSETS_BASE}/${slug}`;
}

/** Devuelve la ruta pública del manifiesto (índice de archivos) de una categoría. */
export function evidenceManifestUrl(slug: string): string {
  return `${evidenceFolderUrl(slug)}/manifest.json`;
}

/** Busca una categoría por su slug. Lanza si no existe (error de configuración). */
export function findEvidenceCategory(slug: string): EvidenceCategory | undefined {
  return EVIDENCE_CATEGORIES.find((category) => category.slug === slug);
}

/**
 * Datos que recibe cada ruta de categoría a través de `route.data`.
 * para que app.routes.ts y EvidenceCategoryPageComponent puedan importarla sin crear una
 * dependencia circular entre ambos archivos.
 */
export interface EvidenceRouteData {
  category: EvidenceCategory;
}
