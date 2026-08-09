import { Component, HostListener, OnDestroy, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

interface NavLink {
  id: string;
  label: string;
}

/**
 * Navbar fijo con scroll-spy hacia las secciones de la home.
 *
 * Como el sitio ahora tiene rutas propias para cada categoría de
 * evidencias (/modelo, /sql, etc.), un click en un link del navbar
 * puede pasar por dos casos:
 *   1. Ya estamos en la home ('/'): se hace scroll suave directo.
 *   2. Estamos en otra página: primero se navega a la home y, una vez
 *      la navegación termina, se hace el scroll hacia la sección.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="navbar" [class.navbar--scrolled]="scrolled()">
      <button type="button" class="navbar__logo" (click)="goHome('inicio')" aria-label="Ir al inicio">
        NR
      </button>

      <div class="navbar__links">
        @for (link of links; track link.id) {
          <button
            type="button"
            class="navbar__link"
            [class.navbar__link--active]="active() === link.id"
            (click)="goHome(link.id)"
          >
            {{ link.label }}
          </button>
        }
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 40;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-sm);
      padding: 14px clamp(16px, 5vw, 48px);
      background: rgba(7, 21, 16, 0.35);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(127, 227, 184, 0.12);
      transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .navbar--scrolled {
      background: rgba(7, 21, 16, 0.72);
      border-bottom-color: rgba(127, 227, 184, 0.2);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }

    .navbar__logo {
      background: none;
      border: none;
      font-family: var(--font-display);
      font-style: italic;
      font-size: 1.15rem;
      color: var(--emerald-soft);
      letter-spacing: 0.02em;
      padding: 4px;
    }

    .navbar__links {
      display: flex;
      align-items: center;
      gap: clamp(6px, 2vw, 22px);
      overflow-x: auto;
      scrollbar-width: none;
      max-width: 100%;
    }

    .navbar__links::-webkit-scrollbar {
      display: none;
    }

    .navbar__link {
      position: relative;
      background: none;
      border: none;
      white-space: nowrap;
      color: var(--muted);
      font-size: 0.78rem;
      letter-spacing: 0.04em;
      padding: 6px 4px;
      transition: color 0.25s ease;
    }

    .navbar__link::after {
      content: '';
      position: absolute;
      left: 2px;
      right: 2px;
      bottom: -2px;
      height: 2px;
      border-radius: 2px;
      background: linear-gradient(90deg, var(--emerald), var(--gold));
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s ease;
    }

    .navbar__link:hover {
      color: var(--starlight);
    }

    .navbar__link--active {
      color: var(--starlight);
    }

    .navbar__link--active::after {
      transform: scaleX(1);
    }

    @media (max-width: 480px) {
      .navbar { padding: 12px 14px; }
      .navbar__link { font-size: 0.68rem; }
      .navbar__links { gap: 12px; }
    }
  `]
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  readonly links: NavLink[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'sobre-mi', label: 'Sobre mí' },
    { id: 'conoceme', label: 'Conóceme' },
    { id: 'evidencias', label: 'Evidencias' },
    { id: 'contacto', label: 'Contacto' }
  ];

  readonly active = signal('inicio');
  readonly scrolled = signal(false);

  private observer?: IntersectionObserver;
  private routerSub?: Subscription;

  constructor(private readonly router: Router) {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 10);
  }

  ngAfterViewInit(): void {
    this.observeSectionsWhenAvailable();

    // Si el navbar se re-renderiza estando en una página de categoría y
    // luego el usuario vuelve a la home, hay que volver a enganchar el
    // scroll-spy porque las secciones (#inicio, #sobre-mi, etc.) recién
    // vuelven a existir en el DOM.
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.observeSectionsWhenAvailable());
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.routerSub?.unsubscribe();
  }

  /**
   * Navega a una sección del home. Si ya estamos en la home, hace scroll
   * directo; si estamos en otra ruta (una página de categoría), navega a
   * la home con el fragmento y hace scroll una vez cargada.
   */
  goHome(id: string): void {
    if (this.router.url === '/' || this.router.url.startsWith('/#')) {
      this.scrollTo(id);
      return;
    }

    this.router.navigate(['/']).then(() => {
      // Espera un tick a que Angular pinte las secciones de la home.
      setTimeout(() => this.scrollTo(id), 0);
    });
  }

  private scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 78;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  private observeSectionsWhenAvailable(): void {
    if (!('IntersectionObserver' in window)) return;
    this.observer?.disconnect();

    const sections = this.links
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => !!el);

    if (!sections.length) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.active.set(entry.target.id);
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    for (const section of sections) {
      this.observer.observe(section);
    }
  }
}
