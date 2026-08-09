import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EVIDENCE_CATEGORIES, EvidenceCategory } from '../../pages/evidence-category-page/evidence-categories';

/**
 * Galería de evidencias de la home.
 *
 * Muestra una tarjeta por cada categoría definida en EVIDENCE_CATEGORIES
 * (fuente única de verdad compartida con las rutas). Cada tarjeta navega,
 * mediante routerLink, a la página artística de esa categoría
 * (ver EvidenceCategoryPageComponent).
 */
@Component({
  selector: 'app-evidence-gallery',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="evidence">
      <button
        type="button"
        class="toggle"
        (click)="toggleOpen()"
        [attr.aria-expanded]="isOpen()"
      >
        <span class="toggle__dot"></span>
        Evidencias
        <span class="toggle__chevron" [class.toggle__chevron--open]="isOpen()">⌄</span>
      </button>

      @if (isOpen()) {
        <div class="grid">
          @for (cat of categories; track cat.slug) {
            <a class="card" [class.card--wide]="cat.wide" [routerLink]="'/' + cat.slug">
              <span class="card__icon" [style.background]="cat.accentColor">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  @switch (cat.icon) {
                    @case ('model') {
                      <!-- Diagrama entidad-relación: nodos conectados -->
                      <rect x="3" y="4" width="7" height="5" rx="1.2" />
                      <rect x="14" y="4" width="7" height="5" rx="1.2" />
                      <rect x="8.5" y="15" width="7" height="5" rx="1.2" />
                      <path d="M6.5 9v3.2h5.3V15" />
                      <path d="M17.5 9v3.2h-5.2V15" />
                    }
                    @case ('normalization') {
                      <!-- Una tabla grande dividiéndose en tablas normalizadas más pequeñas -->
                      <rect x="3" y="3.5" width="8" height="6" rx="1" />
                      <path d="M11 6.5h3" />
                      <rect x="14.5" y="3.5" width="7" height="6" rx="1" />
                      <path d="M6 9.5v2.5" />
                      <rect x="3" y="14.5" width="7" height="6" rx="1" />
                      <rect x="14" y="14.5" width="7" height="6" rx="1" />
                    }
                    @case ('sql') {
                      <!-- Cilindro clásico de base de datos -->
                      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.5" />
                      <path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13" />
                      <path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5" />
                    }
                    @case ('research') {
                      <!-- Lupa sobre un documento con líneas de datos -->
                      <rect x="3.5" y="3.5" width="10" height="13" rx="1.3" />
                      <path d="M6 7.5h5M6 10.5h5M6 13.5h2.8" />
                      <circle cx="16.5" cy="15.5" r="3.6" />
                      <path d="M19 18l2.3 2.3" />
                    }
                    @case ('project') {
                      <!-- Portapapeles con check: proyecto entregado -->
                      <rect x="5" y="4" width="14" height="17" rx="1.6" />
                      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
                      <path d="M8.5 12.5l2.4 2.4L15.5 10" />
                    }
                  }
                </svg>
              </span>
              <h3 class="card__title">{{ cat.title }}</h3>
              <p class="card__status">{{ cat.description }}</p>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .evidence {
      width: 100%;
      max-width: var(--max-width);
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-md);
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(16, 42, 31, 0.4);
      border: 1px solid rgba(127, 227, 184, 0.35);
      color: var(--starlight);
      font-family: var(--font-body);
      font-size: 0.95rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 12px 26px;
      border-radius: 999px;
      transition: background 0.25s ease, border-color 0.25s ease;
    }

    .toggle:hover {
      background: rgba(16, 162, 106, 0.25);
      border-color: var(--emerald-soft);
    }

    .toggle__dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--gold);
      box-shadow: 0 0 8px 2px rgba(231, 178, 95, 0.7);
    }

    .toggle__chevron {
      display: inline-block;
      transition: transform 0.25s ease;
    }

    .toggle__chevron--open {
      transform: rotate(180deg);
    }

    .grid {
      width: 100%;
      max-width: 480px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-sm);
      animation: unfold 0.4s ease;
    }

    @keyframes unfold {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card {
      aspect-ratio: 3 / 4.2;
      background: linear-gradient(165deg, rgba(16, 42, 31, 0.6), rgba(7, 21, 16, 0.6));
      border: 1px solid rgba(127, 227, 184, 0.22);
      border-radius: 16px;
      padding: var(--space-sm);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      text-align: center;
      color: var(--starlight);
      transition: transform 0.25s ease, border-color 0.25s ease;
    }

    .card--wide {
      grid-column: 1 / -1;
      max-width: 220px;
      margin: 0 auto;
      aspect-ratio: 3 / 4.2;
    }

    .card:hover {
      transform: translateY(-4px);
      border-color: var(--emerald-soft);
      color: var(--starlight);
    }

    .card__icon {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--void);
    }

    .card__icon svg {
      width: 24px;
      height: 24px;
    }

    .card__title {
      font-size: 1rem;
      color: var(--starlight);
    }

    .card__status {
      font-size: 0.75rem;
      color: var(--muted);
      letter-spacing: 0.03em;
    }

    @media (max-width: 480px) {
      .grid { max-width: 320px; }
    }
  `]
})
export class EvidenceGalleryComponent {
  readonly isOpen = signal(false);
  readonly categories: readonly EvidenceCategory[] = EVIDENCE_CATEGORIES;

  toggleOpen(): void {
    this.isOpen.set(!this.isOpen());
  }
}
