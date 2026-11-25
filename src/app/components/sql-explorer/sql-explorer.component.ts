import { Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { EvidenceFile, EvidenceGroup } from '../../models/evidence.models';
import { EvidenceService } from '../../services/evidence.service';
import { HighlightedLine, SqlOutlineEntry, highlightSql, sqlOutline } from '../../utils/sql-highlight';

interface ScriptGroup {
  slug: string;
  title: string | null;
  description: string | null;
  files: EvidenceFile[];
}

/**
 * Explorador de scripts SQL con aspecto de editor: a la izquierda la lista
 * de scripts por grupo y a la derecha el código con números de línea,
 * resaltado de sintaxis y un índice para saltar a cada consulta.
 */
@Component({
  selector: 'app-sql-explorer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sql-explorer.component.html',
  styleUrl: './sql-explorer.component.css'
})
export class SqlExplorerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) groups: EvidenceGroup[] = [];

  @ViewChild('code') codeRef?: ElementRef<HTMLDivElement>;

  readonly scriptGroups = signal<ScriptGroup[]>([]);
  readonly selected = signal<EvidenceFile | null>(null);
  readonly source = signal<string | null>(null);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly copied = signal(false);
  readonly flashLine = signal<number | null>(null);

  readonly lines = computed<HighlightedLine[]>(() => {
    const text = this.source();
    return text ? highlightSql(text.replace(/\n+$/, '')) : [];
  });

  readonly outline = computed<SqlOutlineEntry[]>(() => {
    const text = this.source();
    return text ? sqlOutline(text) : [];
  });

  readonly selectedGroup = computed(() => {
    const file = this.selected();
    return this.scriptGroups().find((g) => g.files.includes(file!)) ?? null;
  });

  private loadSub?: Subscription;
  private copyTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly evidence: EvidenceService) {}

  ngOnChanges(): void {
    const groups = this.groups
      .map((g) => ({ slug: g.slug, title: g.title, description: g.description, files: g.files.filter((f) => f.kind === 'sql') }))
      .filter((g) => g.files.length);
    this.scriptGroups.set(groups);
    const first = groups[0]?.files[0];
    if (first && !this.selected()) this.select(first);
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
    clearTimeout(this.copyTimer);
  }

  select(file: EvidenceFile): void {
    if (this.selected() === file && this.status() === 'ready') return;
    this.selected.set(file);
    this.status.set('loading');
    this.source.set(null);
    this.loadSub?.unsubscribe();
    this.loadSub = this.evidence.text(file.url).subscribe((text) => {
      if (text === null) {
        this.status.set('error');
        return;
      }
      this.source.set(text);
      this.status.set('ready');
      this.codeRef?.nativeElement.scrollTo({ top: 0 });
    });
  }

  jumpTo(line: number): void {
    const container = this.codeRef?.nativeElement;
    const row = container?.querySelector<HTMLElement>(`[data-line="${line}"]`);
    if (!container || !row) return;
    container.scrollTo({ top: row.offsetTop - 16, behavior: 'smooth' });
    this.flashLine.set(line);
    setTimeout(() => {
      if (this.flashLine() === line) this.flashLine.set(null);
    }, 1600);
  }

  copy(): void {
    const text = this.source();
    if (!text || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.copied.set(false), 1800);
    });
  }

  /** "Selección (σ), proyección..." -> solo el nombre corto para el índice lateral. */
  descriptionLines(file: EvidenceFile | null): string[] {
    return (file?.description ?? '').split('\n').filter(Boolean);
  }
}
