import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Pantalla de carga inicial: se muestra 100% opaca sobre toda la app,
 * "pinta" el nombre con un efecto de clip-path y luego se desvanece.
 * Respeta `prefers-reduced-motion` desactivando la animación.
 */
@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="loader" [class.loader--fading]="fading()" aria-hidden="true">
        <div class="loader__stage">
          <span class="loader__brush"></span>
          <p class="loader__name">Nataly Rengifo</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .loader {
      position: fixed;
      inset: 0;
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--void);
      transition: opacity 0.5s ease;
    }

    .loader--fading {
      opacity: 0;
      pointer-events: none;
    }

    .loader__stage {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .loader__name {
      font-family: var(--font-display);
      font-style: italic;
      font-weight: 500;
      font-size: clamp(1.6rem, 5vw, 2.6rem);
      color: var(--starlight);
      letter-spacing: 0.02em;
      clip-path: inset(0 100% 0 0);
      animation: paint-reveal 1.4s cubic-bezier(0.65, 0, 0.35, 1) forwards 0.15s;
    }

    .loader__brush {
      position: absolute;
      top: -14px;
      left: 0;
      width: 14px;
      height: 14px;
      border-radius: 50% 55% 50% 60% / 55% 50% 60% 50%;
      background: var(--gold);
      box-shadow: 0 0 12px 3px rgba(231, 178, 95, 0.6);
      animation: brush-travel 1.4s cubic-bezier(0.65, 0, 0.35, 1) forwards 0.15s;
    }

    @keyframes paint-reveal {
      to { clip-path: inset(0 0 0 0); }
    }

    @keyframes brush-travel {
      from { left: 0; }
      to { left: 100%; }
    }

    @media (prefers-reduced-motion: reduce) {
      .loader__name { clip-path: inset(0 0 0 0); animation: none; }
      .loader__brush { display: none; }
    }
  `]
})
export class AppLoaderComponent implements OnInit {
  readonly visible = signal(true);
  readonly fading = signal(false);

  ngOnInit(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.style.overflow = 'hidden';

    const fadeDelay = reduced ? 300 : 1700;
    const removeDelay = fadeDelay + 500;

    setTimeout(() => this.fading.set(true), fadeDelay);
    setTimeout(() => {
      this.visible.set(false);
      document.body.style.overflow = '';
    }, removeDelay);
  }
}
