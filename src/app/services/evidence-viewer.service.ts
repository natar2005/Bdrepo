import { Injectable, computed, signal } from '@angular/core';
import { EvidenceFile } from '../models/evidence.models';

interface ViewerState {
  items: EvidenceFile[];
  index: number;
}

/**
 * Estado del visor de evidencias (imágenes y PDF a pantalla completa).
 * Cualquier tarjeta llama a open() con la lista de su grupo, para poder
 * pasar a la anterior o la siguiente sin cerrar el visor.
 */
@Injectable({ providedIn: 'root' })
export class EvidenceViewerService {
  private readonly state = signal<ViewerState | null>(null);

  readonly isOpen = computed(() => this.state() !== null);
  readonly current = computed(() => {
    const s = this.state();
    return s ? s.items[s.index] : null;
  });
  readonly position = computed(() => {
    const s = this.state();
    return s ? { index: s.index, total: s.items.length } : null;
  });

  open(items: EvidenceFile[], file: EvidenceFile): void {
    const index = Math.max(0, items.indexOf(file));
    this.state.set({ items: items.length ? items : [file], index });
  }

  close(): void {
    this.state.set(null);
  }

  next(): void {
    this.move(1);
  }

  previous(): void {
    this.move(-1);
  }

  private move(step: number): void {
    const s = this.state();
    if (!s || s.items.length < 2) return;
    const index = (s.index + step + s.items.length) % s.items.length;
    this.state.set({ ...s, index });
  }
}
