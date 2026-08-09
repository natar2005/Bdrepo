import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PaintBackgroundComponent } from './components/paint-background/paint-background.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AppLoaderComponent } from './components/app-loader/app-loader.component';
import { PaintCursorComponent } from './components/paint-cursor/paint-cursor.component';

/**
 * Componente raíz con loader inicial, cursor de pintura, fondo animado, navbar y footer y el
 * `<router-outlet>` donde se renderiza la página activa.
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
    PaintCursorComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
