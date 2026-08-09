import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { EvidenceCategoryPageComponent } from './pages/evidence-category-page/evidence-category-page.component';
import { EVIDENCE_CATEGORIES, EvidenceRouteData } from './pages/evidence-category-page/evidence-categories';

/**
 * Una ruta por cada categoría definida en EVIDENCE_CATEGORIES, generada
 * automáticamente para no repetir la misma configuración 5 veces.
 * */
const evidenceRoutes: Routes = EVIDENCE_CATEGORIES.map((category) => ({
  path: category.slug,
  component: EvidenceCategoryPageComponent,
  title: `${category.title} · Evidencias — Nataly Rengifo`,
  data: { category } satisfies EvidenceRouteData
}));

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Nataly Rengifo — Portafolio' },
  ...evidenceRoutes,
  { path: '**', redirectTo: '' }
];
