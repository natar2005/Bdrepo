import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Cursor personalizado en forma de "gota de pintura" que sigue al mouse
 * con inercia (lerp) y crece al pasar sobre elementos interactivos.
 *
 */
@Component({
  selector: 'app-paint-cursor',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="cursor-dab" #dab></div>`,
  styles: [`
    .cursor-dab {
      position: fixed;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 162, 106, 0.55), rgba(16, 162, 106, 0) 70%);
      mix-blend-mode: screen;
      pointer-events: none;
      z-index: 60;
      opacity: 0;
      transform: translate3d(-50%, -50%, 0);
      transition: width 0.25s ease, height 0.25s ease, background 0.25s ease, opacity 0.3s ease;
      will-change: transform;
    }

    .cursor-dab--active {
      width: 34px;
      height: 34px;
      background: radial-gradient(circle, rgba(231, 178, 95, 0.55), rgba(231, 178, 95, 0) 70%);
    }
  `]
})
export class PaintCursorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dab', { static: true }) dabRef!: ElementRef<HTMLDivElement>;

  private enabled = false;
  private x = 0;
  private y = 0;
  private cx = 0;
  private cy = 0;
  private frameId = 0;
  private moveHandler = (e: MouseEvent) => this.onMove(e);
  private overHandler = (e: MouseEvent) => this.onOver(e);

  ngAfterViewInit(): void {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.enabled = finePointer && !reducedMotion;
    if (!this.enabled) return;

    window.addEventListener('mousemove', this.moveHandler, { passive: true });
    document.addEventListener('mouseover', this.overHandler, { passive: true });
    this.tick();
  }

  ngOnDestroy(): void {
    if (!this.enabled) return;
    window.removeEventListener('mousemove', this.moveHandler);
    document.removeEventListener('mouseover', this.overHandler);
    cancelAnimationFrame(this.frameId);
  }

  private onMove(e: MouseEvent): void {
    this.x = e.clientX;
    this.y = e.clientY;
    const el = this.dabRef.nativeElement;
    if (el.style.opacity !== '1') el.style.opacity = '1';
  }

  private onOver(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const isInteractive = !!target.closest('a, button, [role="button"], input, textarea');
    this.dabRef.nativeElement.classList.toggle('cursor-dab--active', isInteractive);
  }

  private tick = (): void => {
    this.cx += (this.x - this.cx) * 0.18;
    this.cy += (this.y - this.cy) * 0.18;
    this.dabRef.nativeElement.style.transform = `translate3d(${this.cx}px, ${this.cy}px, 0) translate(-50%, -50%)`;
    this.frameId = requestAnimationFrame(this.tick);
  };
}
