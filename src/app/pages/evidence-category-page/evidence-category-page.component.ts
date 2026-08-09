import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';
import { EvidenceCategory, EvidenceRouteData, evidenceManifestUrl } from './evidence-categories';


interface EvidenceFile {
  name: string;
  url: string;
  extension: string;
  sizeBytes: number;
  sizeLabel: string;
}


interface EvidenceManifest {
  category: string;
  generatedAt: string;
  files: EvidenceFile[];
}

type LoadStatus = 'loading' | 'ready' | 'empty' | 'error';


const EXTENSION_GLYPHS: Record<string, string> = {
  pdf: 'PDF',
  png: 'IMG',
  jpg: 'IMG',
  jpeg: 'IMG',
  webp: 'IMG',
  gif: 'IMG',
  svg: 'SVG',
  doc: 'DOC',
  docx: 'DOC',
  xls: 'XLS',
  xlsx: 'XLS',
  ppt: 'PPT',
  pptx: 'PPT',
  sql: 'SQL',
  csv: 'CSV',
  txt: 'TXT',
  zip: 'ZIP'
};

/**
 * Página de una evidencia (Modelo, Normalización,
 * SQL, Investigación o Proyecto).
 *
 * Se usa esta para las n evidencias que hayan y recibe cuál le
 * corresponde a través de" route.data.category" (en app.routes.ts) y
 * carga la lista de archivos desde el "manifest.json" de esa carpeta.
 */
@Component({
  selector: 'app-evidence-category-page',
  standalone: true,
  imports: [CommonModule, RevealOnScrollDirective],
  templateUrl: './evidence-category-page.component.html',
  styleUrl: './evidence-category-page.component.css'
})
export class EvidenceCategoryPageComponent implements OnInit {
  /** Evidencia activa, resuelta desde los datos de la ruta actual. */
  category!: EvidenceCategory;

  readonly status = signal<LoadStatus>('loading');
  readonly files = signal<EvidenceFile[]>([]);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data as EvidenceRouteData;
    this.category = data.category;
    this.loadManifest();
  }

  /** Devuelve el string para el ícono circular de un archivo. */
  fileGlyph(extension: string): string {
    return EXTENSION_GLYPHS[extension] ?? '•';
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

  private loadManifest(): void {
    this.status.set('loading');

    this.http
      .get<EvidenceManifest>(evidenceManifestUrl(this.category.slug))
      .pipe(catchError(() => of(null)))
      .subscribe((manifest) => {
        if (!manifest) {
          this.status.set('error');
          return;
        }
        this.files.set(manifest.files ?? []);
        this.status.set(manifest.files?.length ? 'ready' : 'empty');
      });
  }
}
