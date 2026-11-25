import { Component, Input, OnChanges, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  EvidenceFile,
  GuidedColumn,
  GuidedTable,
  SheetCellStyle,
  SheetPreview,
  WorkbookPreview
} from '../../models/evidence.models';
import { EvidenceService } from '../../services/evidence.service';

interface GridCell {
  key: string;
  text: string;
  style: Record<string, string>;
  rowspan: number;
  colspan: number;
}

interface GridRow {
  n: number;
  height: number;
  cells: GridCell[];
}

interface StepTableView extends GuidedTable {
  isNew: boolean;
  renamedFrom: string | null;
  removed: string[];
}

interface StepView {
  label: string | null;
  tables: StepTableView[];
  details: { title: string; text: string }[];
}

interface SectionView {
  title: string | null;
  steps: StepView[];
}

const ZOOMS = [0.6, 0.75, 0.9, 1];

/**
 * Muestra un libro de Excel dentro de la página, con una pestaña por hoja
 * y dos formas de verla:
 *  - "Paso a paso": las tablas de cada paso de la normalización, marcando
 *    las tablas nuevas y los atributos que salen, junto a la explicación
 *    de la "TABLA DE PASOS".
 *  - "Hoja de Excel": la hoja tal cual, con sus celdas, colores y bordes.
 */
@Component({
  selector: 'app-sheet-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sheet-viewer.component.html',
  styleUrl: './sheet-viewer.component.css'
})
export class SheetViewerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) file!: EvidenceFile;

  readonly workbook = signal<WorkbookPreview | null>(null);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly activeIndex = signal(0);
  readonly mode = signal<'guided' | 'grid'>('guided');
  readonly zoomIndex = signal(1);

  readonly sheet = computed<SheetPreview | null>(() => this.workbook()?.sheets[this.activeIndex()] ?? null);
  readonly hasGuided = computed(() => !!this.sheet()?.guided?.sections.length);
  readonly effectiveMode = computed(() => (this.hasGuided() ? this.mode() : 'grid'));
  readonly zoom = computed(() => ZOOMS[this.zoomIndex()]);

  readonly sections = computed<SectionView[]>(() => {
    const guided = this.sheet()?.guided;
    return guided ? buildSections(guided.sections) : [];
  });

  readonly columnLetters = computed(() => {
    const s = this.sheet();
    return s ? Array.from({ length: s.cols }, (_, i) => columnName(i + 1)) : [];
  });

  readonly grid = computed<GridRow[]>(() => {
    const s = this.sheet();
    return s ? buildGrid(s) : [];
  });

  private sub?: Subscription;

  constructor(private readonly evidence: EvidenceService) {}

  ngOnChanges(): void {
    if (!this.file?.sheet) {
      this.status.set('error');
      return;
    }
    this.status.set('loading');
    this.sub?.unsubscribe();
    this.sub = this.evidence.workbook(this.file.sheet).subscribe((wb) => {
      this.workbook.set(wb);
      this.status.set(wb && wb.sheets.length ? 'ready' : 'error');
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  selectSheet(index: number): void {
    this.activeIndex.set(index);
  }

  setMode(mode: 'guided' | 'grid'): void {
    this.mode.set(mode);
  }

  zoomIn(): void {
    this.zoomIndex.set(Math.min(this.zoomIndex() + 1, ZOOMS.length - 1));
  }

  zoomOut(): void {
    this.zoomIndex.set(Math.max(this.zoomIndex() - 1, 0));
  }

  stepLabel(label: string | null): string {
    if (!label) return '';
    return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  }

  columnClass(col: GuidedColumn): string {
    if (col.fk) return 'attr attr--fk';
    if (col.key) return 'attr attr--key';
    return 'attr';
  }
}

// ------------------------------------------------------------- utilidades

function columnName(n: number): string {
  let name = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function cssOf(style: SheetCellStyle | undefined): Record<string, string> {
  const css: Record<string, string> = {};
  if (!style) return css;
  if (style.b) css['font-weight'] = '700';
  if (style.i) css['font-style'] = 'italic';
  if (style.u || style.s) css['text-decoration'] = [style.u ? 'underline' : '', style.s ? 'line-through' : ''].join(' ').trim();
  if (style.c) css['color'] = style.c;
  if (style.fs) css['font-size'] = `${(style.fs * 4) / 3}px`;
  if (style.bg) css['background'] = style.bg;
  if (style.ha) css['text-align'] = style.ha.startsWith('center') ? 'center' : style.ha === 'fill' ? 'left' : style.ha;
  if (style.va) css['vertical-align'] = style.va === 'center' ? 'middle' : style.va;
  css['white-space'] = style.w ? 'normal' : 'nowrap';
  if (style.bt) css['border-top'] = style.bt;
  if (style.br) css['border-right'] = style.br;
  if (style.bb) css['border-bottom'] = style.bb;
  if (style.bl) css['border-left'] = style.bl;
  return css;
}

function buildGrid(sheet: SheetPreview): GridRow[] {
  const byPos = new Map<string, GridCell>();
  const covered = new Set<string>();
  for (const [r, c, text, styleIndex, rowspan = 1, colspan = 1] of sheet.cells) {
    byPos.set(`${r}:${c}`, { key: `${r}:${c}`, text, style: cssOf(sheet.styles[styleIndex]), rowspan, colspan });
    for (let rr = r; rr < r + rowspan; rr++) {
      for (let cc = c; cc < c + colspan; cc++) {
        if (rr !== r || cc !== c) covered.add(`${rr}:${cc}`);
      }
    }
  }
  const rows: GridRow[] = [];
  for (let r = 1; r <= sheet.rows; r++) {
    const cells: GridCell[] = [];
    for (let c = 1; c <= sheet.cols; c++) {
      const key = `${r}:${c}`;
      if (covered.has(key)) continue;
      cells.push(byPos.get(key) ?? { key, text: '', style: {}, rowspan: 1, colspan: 1 });
    }
    rows.push({ n: r, height: sheet.rowHeights[r - 1] ?? 20, cells });
  }
  return rows;
}

/**
 * Compara cada paso con el anterior para mostrar el "antes y después":
 * qué tablas son nuevas y qué atributos salieron de cada tabla.
 */
function buildSections(sections: { title: string | null; steps: { label: string | null; tables: GuidedTable[]; details: { title: string; text: string }[] }[] }[]): SectionView[] {
  let previous: GuidedTable[] = [];
  return sections.map((section) => ({
    title: section.title,
    steps: section.steps.map((step) => {
      const matchedPrev = new Set<string>();
      const sameName = new Map(previous.map((t) => [t.name, t]));
      const views: StepTableView[] = step.tables.map((table) => {
        const prev = sameName.get(table.name);
        if (prev) matchedPrev.add(prev.name);
        return { ...table, isNew: !prev, renamedFrom: null, removed: prev ? removedColumns(prev, table) : [] };
      });
      // una tabla con otro nombre que conserva casi todos los atributos de una
      // tabla anterior no es nueva: es la misma tabla con otro nombre
      for (const view of views.filter((v) => v.isNew)) {
        const candidate = previous
          .filter((p) => !matchedPrev.has(p.name))
          .map((p) => ({ p, overlap: overlap(p, view) }))
          .sort((a, b) => b.overlap - a.overlap)[0];
        if (candidate && candidate.overlap >= 0.6) {
          matchedPrev.add(candidate.p.name);
          view.isNew = false;
          view.renamedFrom = candidate.p.name;
          view.removed = removedColumns(candidate.p, view);
        }
      }
      if (step.tables.length) previous = step.tables;
      return { label: step.label, tables: views, details: step.details };
    })
  }));
}

function removedColumns(before: GuidedTable, after: GuidedTable): string[] {
  const now = new Set(after.columns.map((c) => c.name));
  return before.columns.map((c) => c.name).filter((name) => !now.has(name));
}

function overlap(a: GuidedTable, b: GuidedTable): number {
  const names = new Set(a.columns.map((c) => c.name));
  const shared = b.columns.filter((c) => names.has(c.name)).length;
  return b.columns.length ? shared / b.columns.length : 0;
}
