import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FunFact {
  label: string;
  text: string;
}

const DAB_COLORS = ['#10a26a', '#e7b25f', '#d97757', '#7fe3b8', '#0b6e4f'];

/**
 * Panel de retrato interactivo de la sección "Sobre mí".
 * En este panel hay una foto real / avatar ilustrado que se voltea al hover,
 * focus o click, y una paleta de colores de datos curiosos: cada botón de color revela un
 *    `FunFact` distinto en ".palette__reveal".
 */
@Component({
  selector: 'app-portrait-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel">
      <!-- Retrato enmarcado: foto real <-> avatar ilustrado -->
      <div
        class="frame"
        [class.frame--flipped]="flipped()"
        tabindex="0"
        role="img"
        [attr.aria-label]="name + ', haz clic para ver mi versión ilustrada'"
        (mouseenter)="flipped.set(true)"
        (mouseleave)="flipped.set(false)"
        (focus)="flipped.set(true)"
        (blur)="flipped.set(false)"
        (click)="flipped.set(!flipped())"
      >
        <div class="frame__inner">
          <img class="frame__img frame__img--photo" [src]="photoSrc" [alt]="name" />
          <img class="frame__img frame__img--avatar" [src]="avatarSrc" [alt]="name + ' (ilustración)'" />
        </div>
        <span class="frame__corner frame__corner--tl"></span>
        <span class="frame__corner frame__corner--tr"></span>
        <span class="frame__corner frame__corner--bl"></span>
        <span class="frame__corner frame__corner--br"></span>
      </div>

      <!-- Paleta de datos curiosos -->
      <div class="palette">
        <p class="palette__hint">Toca un color de la paleta ✦</p>
        <div class="palette__dabs">
          @for (fact of funFacts; track fact.label; let i = $index) {
            <button
              type="button"
              class="dab"
              [style.background]="dabColor(i)"
              [class.dab--active]="activeFact() === i"
              (mouseenter)="setActive(i)"
              (focus)="setActive(i)"
              (click)="toggleActive(i)"
              [attr.aria-expanded]="activeFact() === i"
              [attr.aria-label]="fact.label"
            ></button>
          }
        </div>

        <div class="palette__reveal" [class.palette__reveal--empty]="activeFact() === null">
          @if (activeFact() !== null) {
            <p class="palette__label">{{ funFacts[activeFact()!].label }}</p>
            <p class="palette__text">{{ funFacts[activeFact()!].text }}</p>
          } @else {
            <p class="palette__text palette__text--muted">
              Cada color guarda un dato curioso sobre mí.
            </p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-md);
      width: 100%;
    }

    .frame {
      position: relative;
      width: clamp(200px, 30vw, 280px);
      aspect-ratio: 4 / 5;
      padding: 14px;
      background: linear-gradient(155deg, rgba(16, 42, 31, 0.9), rgba(7, 21, 16, 0.95));
      border-radius: 6px;
      box-shadow:
        0 0 0 1px rgba(127, 227, 184, 0.25),
        0 18px 45px rgba(0, 0, 0, 0.5),
        0 0 60px 8px rgba(16, 162, 106, 0.14);
      cursor: pointer;
    }

    .frame__inner {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: 2px;
      box-shadow: inset 0 0 0 1px rgba(231, 178, 95, 0.35);
    }

    .frame__img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.5s ease;
    }

    .frame__img--avatar {
      opacity: 0;
    }

    .frame--flipped .frame__img--photo {
      opacity: 0;
    }

    .frame--flipped .frame__img--avatar {
      opacity: 1;
    }

    .frame__corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid var(--gold);
      opacity: 0.7;
    }

    .frame__corner--tl { top: 2px; left: 2px; border-right: none; border-bottom: none; }
    .frame__corner--tr { top: 2px; right: 2px; border-left: none; border-bottom: none; }
    .frame__corner--bl { bottom: 2px; left: 2px; border-right: none; border-top: none; }
    .frame__corner--br { bottom: 2px; right: 2px; border-left: none; border-top: none; }

    .palette {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      width: 100%;
      max-width: 420px;
    }

    .palette__hint {
      font-size: 0.75rem;
      letter-spacing: 0.06em;
      color: var(--muted);
    }

    .palette__dabs {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
    }

    .dab {
      width: 30px;
      height: 30px;
      border-radius: 50% 55% 50% 60% / 55% 50% 60% 50%;
      border: 2px solid rgba(246, 243, 233, 0.15);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .dab:hover,
    .dab:focus-visible,
    .dab--active {
      transform: scale(1.2) rotate(6deg);
      border-color: var(--starlight);
    }

    .palette__reveal {
      width: 100%;
      min-height: 74px;
      background: linear-gradient(160deg, rgba(16, 42, 31, 0.7), rgba(7, 21, 16, 0.7));
      border: 1px solid rgba(127, 227, 184, 0.22);
      border-radius: 14px;
      padding: 14px 18px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
    }

    .palette__label {
      font-family: var(--font-display);
      font-size: 0.95rem;
      color: var(--gold);
    }

    .palette__text {
      font-size: 0.85rem;
      color: var(--starlight);
      line-height: 1.5;
    }

    .palette__text--muted {
      color: var(--muted);
    }
  `]
})
export class PortraitPanelComponent {
  @Input() name = '';
  @Input() photoSrc = '';
  @Input() avatarSrc = '';
  @Input() funFacts: FunFact[] = [];

  readonly flipped = signal(false);
  readonly activeFact = signal<number | null>(null);

  dabColor(i: number): string {
    return DAB_COLORS[i % DAB_COLORS.length];
  }

  setActive(i: number): void {
    this.activeFact.set(i);
  }

  toggleActive(i: number): void {
    this.activeFact.set(this.activeFact() === i ? null : i);
  }
}
