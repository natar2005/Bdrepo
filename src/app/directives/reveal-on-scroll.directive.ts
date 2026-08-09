import { AfterViewInit, Directive, ElementRef, OnDestroy, Renderer2 } from '@angular/core';

/**
 * agrega un fade-in y slide-up suave la primera vez que el elemento entra en el viewport (usa
 * IntersectionObserver y se desconecta después del primer reveal).
 * Con prefers-reduced-motion se muestra visible de inmediato.
 *
 */
@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealOnScrollDirective implements AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    const element = this.el.nativeElement;
    this.renderer.addClass(element, 'reveal');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      this.renderer.addClass(element, 'reveal--visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.renderer.addClass(element, 'reveal--visible');
            this.observer?.unobserve(element);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
