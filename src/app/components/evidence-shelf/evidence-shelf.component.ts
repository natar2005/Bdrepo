import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvidenceFile, canPreview, kindLabel } from '../../models/evidence.models';
import { EvidenceViewerService } from '../../services/evidence-viewer.service';
import { inkFor } from '../../utils/color';

/**
 * Estante de evidencias: una tarjeta por archivo con su portada (la
 * primera página del PDF o una miniatura del diagrama), título,
 * descripción y botones para verlo o descargarlo.
 *
 * Si el grupo tiene documentos las portadas son verticales (como una
 * hoja); si solo tiene imágenes, horizontales (como un diagrama).
 */
@Component({
  selector: 'app-evidence-shelf',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evidence-shelf.component.html',
  styleUrl: './evidence-shelf.component.css'
})
export class EvidenceShelfComponent {
  @Input({ required: true }) files: EvidenceFile[] = [];
  @Input() accent = 'var(--emerald)';

  constructor(private readonly viewer: EvidenceViewerService) {}

  get ink(): string {
    return inkFor(this.accent);
  }

  get landscape(): boolean {
    return this.files.every((f) => f.kind === 'image' || f.kind === 'archive');
  }

  label(file: EvidenceFile): string {
    return kindLabel(file);
  }

  previewable(file: EvidenceFile): boolean {
    return canPreview(file);
  }

  open(file: EvidenceFile): void {
    this.viewer.open(this.files.filter(canPreview), file);
  }

  extensionOf(name: string): string {
    return name.split('.').pop()?.toUpperCase() ?? '';
  }
}
