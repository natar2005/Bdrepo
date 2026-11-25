import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';
import { EvidenceCategory, EvidenceRouteData, findEvidenceCategory } from './evidence-categories';
import { EvidenceFile, EvidenceGroup, EvidenceManifest, kindLabel } from '../../models/evidence.models';
import { EvidenceService } from '../../services/evidence.service';
import { EvidenceViewerService } from '../../services/evidence-viewer.service';
import { EvidenceShelfComponent } from '../../components/evidence-shelf/evidence-shelf.component';
import { SheetViewerComponent } from '../../components/sheet-viewer/sheet-viewer.component';
import { SqlExplorerComponent } from '../../components/sql-explorer/sql-explorer.component';
import { readableOnDark } from '../../utils/color';

type LoadStatus = 'loading' | 'ready' | 'empty' | 'error';

/**
 * Página de una evidencia (Modelo, Normalización, SQL, Investigación o
 * Proyecto).
 *
 * Se usa la misma página para todas las categorías: recibe cuál le
 * corresponde a través de "route.data.category" (en app.routes.ts) y
 * carga el "manifest.json" de esa carpeta. Según el tipo de archivo,
 * cada grupo se muestra de una forma distinta:
 *   - .sql   -> explorador de scripts con el código resaltado
 *   - .xlsx  -> las hojas del libro, paso a paso o como hoja de Excel
 *   - el resto (PDF, Word, imágenes) -> tarjetas con portada que se abren
 *     en el visor a pantalla completa
 */
@Component({
  selector: 'app-evidence-category-page',
  standalone: true,
  imports: [
    CommonModule,
    RevealOnScrollDirective,
    EvidenceShelfComponent,
    SheetViewerComponent,
    SqlExplorerComponent
  ],
  templateUrl: './evidence-category-page.component.html',
  styleUrl: './evidence-category-page.component.css'
})
export class EvidenceCategoryPageComponent implements OnInit, OnDestroy {
  /** Evidencia activa, resuelta desde los datos de la ruta actual. */
  category!: EvidenceCategory;

  readonly status = signal<LoadStatus>('loading');
  readonly manifest = signal<EvidenceManifest | null>(null);

  readonly groups = computed<EvidenceGroup[]>(() => {
    const m = this.manifest();
    if (!m) return [];
    // manifest viejo (solo "files"): todo en un grupo
    return m.groups?.length ? m.groups : [{ slug: 'general', title: null, description: null, files: m.files ?? [] }];
  });

  readonly sqlGroups = computed(() => this.groups().filter((g) => g.files.some((f) => f.kind === 'sql')));

  /** Grupos con algo para mostrar fuera del explorador de SQL. */
  readonly sections = computed(() =>
    this.groups()
      .map((g) => ({
        group: g,
        sheets: g.files.filter((f) => f.kind === 'sheet' && !!f.sheet),
        others: g.files.filter((f) => f.kind !== 'sql' && !(f.kind === 'sheet' && !!f.sheet))
      }))
      .filter((s) => s.sheets.length || s.others.length)
  );

  readonly related = computed(() => this.manifest()?.related ?? []);
  readonly showJumpNav = computed(() => this.sections().filter((s) => s.group.title).length >= 3);

  private sub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly evidence: EvidenceService,
    private readonly viewer: EvidenceViewerService
  ) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data as EvidenceRouteData;
    this.category = data.category;
    this.loadManifest();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.viewer.close();
  }

  /**
   * Vuelve a la home y hace scroll hasta la sección de evidencias.
   */
  goToEvidencias(): void {
    this.router.navigate(['/']).then(() => {
      setTimeout(() => {
        document.getElementById('evidencias')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    });
  }

  scrollToGroup(slug: string): void {
    const el = document.getElementById(`grupo-${slug}`);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  openRelated(file: EvidenceFile): void {
    this.viewer.open(this.related(), file);
  }

  categoryTitle(slug: string | undefined): string {
    return (slug && findEvidenceCategory(slug)?.title) || '';
  }

  /** Color de la categoría, aclarado si es muy oscuro para leerse sobre el fondo. */
  get accentText(): string {
    return readableOnDark(this.category.accentColor);
  }

  label(file: EvidenceFile): string {
    return kindLabel(file);
  }

  private loadManifest(): void {
    this.status.set('loading');
    this.sub = this.evidence.manifest(this.category.slug).subscribe((manifest) => {
      if (!manifest) {
        this.status.set('error');
        return;
      }
      this.manifest.set(manifest);
      const total = (manifest.groups ?? []).reduce((n, g) => n + g.files.length, 0) || manifest.files?.length || 0;
      this.status.set(total ? 'ready' : 'empty');
    });
  }
}
