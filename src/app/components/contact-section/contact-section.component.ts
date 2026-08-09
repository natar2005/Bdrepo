import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Sección "Contacto": tarjetas con correo personal, correo institucional
 * y GitHub. Los valores llegan por @Input desde HomeComponent, que a su
 * vez los toma de `social` (ver home.component.ts).
 */
@Component({
  selector: 'app-contact-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contact">
      <h2 class="contact__title">Contacto<span class="contact__dot">.</span></h2>

      <div class="contact__grid">
        <a class="card" [href]="'mailto:' + personalEmail">
          <span class="card__icon" style="background: var(--emerald)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="M3.5 6.5 12 13 20.5 6.5" />
            </svg>
          </span>
          <span class="card__label">Correo personal</span>
          <span class="card__value">{{ personalEmail }}</span>
        </a>

        <a class="card" [href]="'mailto:' + institutionalEmail">
          <span class="card__icon" style="background: var(--gold)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="M3.5 6.5 12 13 20.5 6.5" />
            </svg>
          </span>
          <span class="card__label">Correo institucional</span>
          <span class="card__value">{{ institutionalEmail }}</span>
        </a>

        <a class="card" [href]="githubUrl" target="_blank" rel="noopener">
          <span class="card__icon" style="background: var(--terracotta)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.58 2 12.2c0 4.5 2.87 8.31 6.84 9.66.5.1.68-.22.68-.5v-1.94c-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.9-1.32 2.74-1.05 2.74-1.05.56 1.4.2 2.44.1 2.7.65.72 1.03 1.63 1.03 2.75 0 3.92-2.35 4.78-4.58 5.03.36.32.68.94.68 1.9v2.82c0 .28.18.61.69.5A10.02 10.02 0 0 0 22 12.2C22 6.58 17.52 2 12 2Z" />
            </svg>
          </span>
          <span class="card__label">GitHub</span>
          <span class="card__value">natar2005</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .contact {
      width: 100%;
      max-width: var(--max-width);
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-sm);
      text-align: center;
    }

    .contact__title {
      font-size: clamp(1.6rem, 4vw, 2.2rem);
      font-style: italic;
      color: var(--starlight);
    }

    .contact__dot {
      color: var(--gold);
    }

    .contact__grid {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--space-sm);
    }

    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: var(--space-md) var(--space-sm);
      background: linear-gradient(160deg, rgba(16, 42, 31, 0.55), rgba(7, 21, 16, 0.55));
      border: 1px solid rgba(127, 227, 184, 0.2);
      border-radius: var(--radius);
      color: var(--starlight);
      transition: transform 0.25s ease, border-color 0.25s ease;
    }

    .card:hover {
      transform: translateY(-4px);
      border-color: var(--emerald-soft);
      color: var(--starlight);
    }

    .card__icon {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--void);
    }

    .card__icon svg {
      width: 18px;
      height: 18px;
    }

    .card__label {
      font-size: 0.7rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .card__value {
      font-size: 0.82rem;
      word-break: break-word;
    }
  `]
})
export class ContactSectionComponent {
  @Input() personalEmail = '';
  @Input() institutionalEmail = '';
  @Input() githubUrl = '';
}
