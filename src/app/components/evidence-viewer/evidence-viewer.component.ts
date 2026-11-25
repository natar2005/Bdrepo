import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EvidenceViewerService } from '../../services/evidence-viewer.service';
import { kindLabel } from '../../models/evidence.models';

interface Point {
  x: number;
  y: number;
}

const MAX_SCALE = 3;

/**
 * Visor a pantalla completa para las evidencias:
 *  - Imágenes (diagramas): se pueden acercar con la rueda del mouse, con
 *    los botones o pellizcando en el celular, y mover arrastrando.
 *  - PDF (y los Word, que tienen su vista previa en PDF): se muestran con
 *    el visor de PDF del navegador.
 * Con el teclado: Esc cierra, ← → cambian de archivo, + − acercan y 0 ajusta.
 */
@Component({
  selector: 'app-evidence-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evidence-viewer.component.html',
  styleUrl: './evidence-viewer.component.css'
})
export class EvidenceViewerComponent implements OnDestroy {
  @ViewChild('stage') stageRef?: ElementRef<HTMLDivElement>;

  private readonly viewer = inject(EvidenceViewerService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly file = this.viewer.current;
  readonly position = this.viewer.position;

  readonly scale = signal(1);
  readonly offset = signal<Point>({ x: 0, y: 0 });
  readonly loaded = signal(false);
  readonly dragging = signal(false);

  /** Algunos navegadores (Chrome en Android) no muestran PDF dentro de la página. */
  readonly pdfInline = typeof navigator === 'undefined' || (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled !== false;

  readonly kind = computed(() => {
    const f = this.file();
    if (!f) return 'none';
    if (f.kind === 'image') return 'image';
    if (f.kind === 'pdf' || f.preview) return 'pdf';
    return 'other';
  });

  readonly pdfSrc = computed<SafeResourceUrl | null>(() => {
    const f = this.file();
    if (!f || this.kind() !== 'pdf') return null;
    const url = f.kind === 'pdf' ? f.url : f.preview!;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`${url}#view=FitH`);
  });

  readonly openUrl = computed(() => {
    const f = this.file();
    if (!f) return '';
    return f.kind === 'document' && f.preview ? f.preview : f.url;
  });

  readonly typeLabel = computed(() => {
    const f = this.file();
    return f ? kindLabel(f) : '';
  });

  readonly transform = computed(() => {
    const o = this.offset();
    return `translate3d(${o.x}px, ${o.y}px, 0) scale(${this.scale()})`;
  });

  readonly zoomLabel = computed(() => `${Math.round(this.scale() * 100)} %`);

  private fitScale = 1;
  private naturalSize = { w: 0, h: 0 };
  private pointers = new Map<number, Point>();
  private lastPan: Point | null = null;
  private pinchStart: { distance: number; scale: number; center: Point; offset: Point } | null = null;
  private previousFocus: HTMLElement | null = null;
  /** Si el visor bloqueó el scroll de la página (para no pisar al loader inicial). */
  private locked = false;

  constructor() {
    // Cada vez que cambia el archivo se reinicia el zoom y se bloquea el scroll de la página.
    effect(() => {
      const f = this.file();
      this.loaded.set(false);
      this.scale.set(1);
      this.offset.set({ x: 0, y: 0 });
      if (f && !this.locked) {
        this.locked = true;
        this.previousFocus = document.activeElement as HTMLElement | null;
        document.body.style.overflow = 'hidden';
      } else if (!f && this.locked) {
        this.locked = false;
        document.body.style.overflow = '';
        this.previousFocus?.focus?.();
        this.previousFocus = null;
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    if (this.locked) document.body.style.overflow = '';
  }

  close(): void {
    this.viewer.close();
  }

  next(): void {
    this.viewer.next();
  }

  previous(): void {
    this.viewer.previous();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (!this.file()) return;
    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowRight':
        this.next();
        break;
      case 'ArrowLeft':
        this.previous();
        break;
      case '+':
      case '=':
        if (this.kind() === 'image') this.zoomBy(1.25);
        break;
      case '-':
        if (this.kind() === 'image') this.zoomBy(0.8);
        break;
      case '0':
        if (this.kind() === 'image') this.fit();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.kind() === 'image' && this.loaded()) this.fit();
  }

  onImageLoad(img: HTMLImageElement): void {
    this.naturalSize = { w: img.naturalWidth, h: img.naturalHeight };
    this.loaded.set(true);
    this.fit();
  }

  // ------------------------------------------------------------- zoom

  fit(): void {
    const stage = this.stageRef?.nativeElement;
    if (!stage || !this.naturalSize.w) return;
    const { clientWidth: sw, clientHeight: sh } = stage;
    const scale = Math.min(sw / this.naturalSize.w, sh / this.naturalSize.h, 1) * 0.96;
    this.fitScale = scale;
    this.scale.set(scale);
    this.offset.set({
      x: (sw - this.naturalSize.w * scale) / 2,
      y: (sh - this.naturalSize.h * scale) / 2
    });
  }

  actualSize(): void {
    const stage = this.stageRef?.nativeElement;
    if (!stage) return;
    this.zoomTo(1, { x: stage.clientWidth / 2, y: stage.clientHeight / 2 });
  }

  zoomBy(factor: number, at?: Point): void {
    const stage = this.stageRef?.nativeElement;
    if (!stage) return;
    this.zoomTo(this.scale() * factor, at ?? { x: stage.clientWidth / 2, y: stage.clientHeight / 2 });
  }

  private zoomTo(target: number, at: Point): void {
    const min = Math.min(this.fitScale * 0.5, 1);
    const scale = Math.min(Math.max(target, min), MAX_SCALE);
    const current = this.scale();
    const o = this.offset();
    this.offset.set({
      x: at.x - (at.x - o.x) * (scale / current),
      y: at.y - (at.y - o.y) * (scale / current)
    });
    this.scale.set(scale);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const rect = this.stageRef!.nativeElement.getBoundingClientRect();
    const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015));
    this.zoomBy(factor, { x: event.clientX - rect.left, y: event.clientY - rect.top });
  }

  onDoubleClick(event: MouseEvent): void {
    const rect = this.stageRef!.nativeElement.getBoundingClientRect();
    const at = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (this.scale() > this.fitScale * 1.5) this.fit();
    else this.zoomTo(Math.max(this.fitScale * 2.5, 1), at);
  }

  // ------------------------------------------------------------- arrastrar y pellizcar

  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 1) {
      this.lastPan = { x: event.clientX, y: event.clientY };
      this.dragging.set(true);
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const rect = this.stageRef!.nativeElement.getBoundingClientRect();
      this.pinchStart = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale: this.scale(),
        center: { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top },
        offset: this.offset()
      };
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.pointers.size >= 2 && this.pinchStart) {
      const [a, b] = [...this.pointers.values()];
      const ratio = Math.hypot(a.x - b.x, a.y - b.y) / this.pinchStart.distance;
      const start = this.pinchStart;
      const min = Math.min(this.fitScale * 0.5, 1);
      const scale = Math.min(Math.max(start.scale * ratio, min), MAX_SCALE);
      this.scale.set(scale);
      this.offset.set({
        x: start.center.x - (start.center.x - start.offset.x) * (scale / start.scale),
        y: start.center.y - (start.center.y - start.offset.y) * (scale / start.scale)
      });
      return;
    }

    if (this.lastPan) {
      const dx = event.clientX - this.lastPan.x;
      const dy = event.clientY - this.lastPan.y;
      this.lastPan = { x: event.clientX, y: event.clientY };
      const o = this.offset();
      this.offset.set({ x: o.x + dx, y: o.y + dy });
    }
  }

  onPointerUp(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinchStart = null;
    if (this.pointers.size === 1) {
      const [p] = [...this.pointers.values()];
      this.lastPan = { ...p };
    } else if (this.pointers.size === 0) {
      this.lastPan = null;
      this.dragging.set(false);
    }
  }
}
