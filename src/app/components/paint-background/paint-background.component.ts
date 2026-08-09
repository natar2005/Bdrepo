import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

interface PaintBlob {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  hue: [number, number, number];
  alpha: number;
  driftSpeed: number;
  driftPhase: number;
  driftRange: number;
}

interface PaintDrip {
  x: number;
  y: number;
  vy: number;
  radius: number;
  hue: [number, number, number];
  alpha: number;
  life: number;
  maxLife: number;
}

const PALETTE: [number, number, number][] = [
  [16, 162, 106],   // emerald
  [11, 110, 79],    // emerald deep
  [127, 227, 184],  // emerald soft
  [231, 178, 95],   // gold / ocre
  [217, 119, 87]    // terracotta
];

/**
 * Fondo animado con manchas de color a la deriva y pequeñas gotas que ascienden
 *  en agunos momentos, con "prefers-reduced-motion" dibuja un solo frame estático.
 */
@Component({
  selector: 'app-paint-background',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas class="paint-canvas" aria-hidden="true"></canvas>`,
  styles: [`
    .paint-canvas {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      display: block;
      background:
        radial-gradient(ellipse 80% 55% at 15% 8%, rgba(11, 110, 79, 0.35), transparent),
        radial-gradient(ellipse 70% 60% at 88% 20%, rgba(231, 178, 95, 0.10), transparent),
        radial-gradient(ellipse 65% 55% at 50% 95%, rgba(16, 42, 31, 0.7), transparent),
        var(--void);
    }
  `]
})
export class PaintBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private blobs: PaintBlob[] = [];
  private drips: PaintDrip[] = [];
  private animationFrameId = 0;
  private width = 0;
  private height = 0;
  private prefersReducedMotion = false;
  private resizeHandler = () => this.handleResize();
  private nextDripAt = 0;
  private elapsed = 0;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;

    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
    this.scheduleNextDrip();

    if (this.prefersReducedMotion) {
      this.drawStaticFrame();
    } else {
      this.tick();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    cancelAnimationFrame(this.animationFrameId);
  }

  private handleResize(): void {
    const canvas = this.canvasRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width * dpr;
    canvas.height = this.height * dpr;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.generateBlobs();
  }

  private generateBlobs(): void {
    const density = this.width < 640 ? 6 : 10;
    this.blobs = Array.from({ length: density }, () => {
      const baseX = Math.random() * this.width;
      const baseY = Math.random() * this.height;
      return {
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        radius: Math.random() * 140 + 90,
        hue: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: Math.random() * 0.10 + 0.06,
        driftSpeed: Math.random() * 0.00025 + 0.00008,
        driftPhase: Math.random() * Math.PI * 2,
        driftRange: Math.random() * 60 + 30
      };
    });
  }

  private scheduleNextDrip(): void {
    this.nextDripAt = this.elapsed + 1200 + Math.random() * 2200;
  }

  private spawnDrip(): void {
    this.drips.push({
      x: Math.random() * this.width,
      y: this.height + 20,
      vy: -(Math.random() * 0.35 + 0.18),
      radius: Math.random() * 3.2 + 1.4,
      hue: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      alpha: Math.random() * 0.5 + 0.35,
      life: 0,
      maxLife: 600 + Math.random() * 400
    });
  }

  private drawStaticFrame(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    for (const b of this.blobs) {
      this.paintBlob(ctx, b.x, b.y, b.radius, b.hue, b.alpha);
    }
  }

  private paintBlob(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    hue: [number, number, number],
    alpha: number
  ): void {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${hue[0]}, ${hue[1]}, ${hue[2]}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${hue[0]}, ${hue[1]}, ${hue[2]}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private tick = (timestamp = 0): void => {
    this.elapsed = timestamp;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = 'lighter';

    // Manchas de pintura flotando lentamente
    for (const b of this.blobs) {
      b.x = b.baseX + Math.cos(this.elapsed * b.driftSpeed + b.driftPhase) * b.driftRange;
      b.y = b.baseY + Math.sin(this.elapsed * b.driftSpeed * 0.8 + b.driftPhase) * b.driftRange;
      this.paintBlob(ctx, b.x, b.y, b.radius, b.hue, b.alpha);
    }

    // Gotas de pintura que ascienden suavemente, como burbujas de color
    if (this.elapsed > this.nextDripAt) {
      this.spawnDrip();
      this.scheduleNextDrip();
    }

    this.drips = this.drips.filter((d) => d.life < d.maxLife);
    for (const d of this.drips) {
      d.life += 1;
      d.y += d.vy;
      d.x += Math.sin(d.life * 0.01) * 0.15;
      const progress = d.life / d.maxLife;
      const alpha = Math.sin(progress * Math.PI) * d.alpha;

      ctx.beginPath();
      ctx.fillStyle = `rgba(${d.hue[0]}, ${d.hue[1]}, ${d.hue[2]}, ${alpha})`;
      ctx.shadowColor = `rgba(${d.hue[0]}, ${d.hue[1]}, ${d.hue[2]}, ${alpha})`;
      ctx.shadowBlur = 6;
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.globalCompositeOperation = 'source-over';
    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
