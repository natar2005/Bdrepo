import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { PaintBackgroundComponent } from './components/paint-background/paint-background.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AppLoaderComponent } from './components/app-loader/app-loader.component';
import { PaintCursorComponent } from './components/paint-cursor/paint-cursor.component';
import { EvidenceViewerComponent } from './components/evidence-viewer/evidence-viewer.component';

/**
 * Componente raíz con loader inicial, cursor de pintura, fondo animado, navbar y footer y el
 * `<router-outlet>` donde se renderiza la página activa.
 * Las páginas de evidencias usan un ancho mayor que la home para que los
 * diagramas, los scripts y las hojas de Excel tengan espacio.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    PaintBackgroundComponent,
    NavbarComponent,
    AppLoaderComponent,
    PaintCursorComponent,
    EvidenceViewerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly widePage = signal(false);

  constructor(router: Router) {
    router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        this.widePage.set(path !== '/' && path !== '');
      });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
