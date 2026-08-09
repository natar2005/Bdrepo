import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Sección Conóceme: una card de foto con mini descripción y
 * debajo el video de presentación embebido */
@Component({
  selector: 'app-video-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="conoceme">
      <h2 class="conoceme__title">Conóceme<span class="conoceme__dots">…</span></h2>

      <div class="intro">
        <img class="intro__photo" [src]="introPhotoSrc" [alt]="name" />
        <div class="intro__content">
          <p class="intro__text">{{ introText }}</p>
          <button type="button" class="intro__cta" (click)="scrollToVideo()">
            <span class="intro__cta-dot"></span>
            Ir al video
          </button>
        </div>
      </div>

      <div class="video-card" #videoAnchor [class.video-card--vertical]="vertical">
        @if (videoSrc) {
          <div class="video-native">
            <video
              [src]="videoSrc"
              [attr.poster]="posterSrc || null"
              controls
              playsinline
              preload="metadata"
            ></video>
          </div>
        } @else if (embedUrl) {
          <div class="video-frame" [class.video-frame--vertical]="vertical">
            <iframe
              [src]="embedUrl"
              title="Video de presentación de {{ name }}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        } @else {
          <div class="video-placeholder">
            <div class="signal">
              <span class="signal__ring"></span>
              <span class="signal__ring signal__ring--delay"></span>
              <span class="signal__dot"></span>
            </div>
            <p class="video-placeholder__title">Video</p>
            <p class="video-placeholder__text">
              Mira mi video de presentación.
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .conoceme {
      width: 100%;
      max-width: 640px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-md);
    }

    .conoceme__title {
      font-size: clamp(1.6rem, 4vw, 2.2rem);
      font-style: italic;
      color: var(--starlight);
    }

    .conoceme__dots {
      color: var(--gold);
    }

    .intro {
      width: 100%;
      display: flex;
      align-items: center;
      gap: var(--space-md);
      background: linear-gradient(160deg, rgba(16, 42, 31, 0.55), rgba(7, 21, 16, 0.55));
      border: 1px solid rgba(127, 227, 184, 0.22);
      border-radius: var(--radius);
      padding: var(--space-sm);
    }

    .intro__photo {
      width: clamp(90px, 22vw, 128px);
      height: clamp(90px, 22vw, 128px);
      object-fit: cover;
      border-radius: 12px;
      flex-shrink: 0;
      box-shadow: 0 0 0 1px rgba(231, 178, 95, 0.35), 0 10px 25px rgba(0, 0, 0, 0.4);
    }

    .intro__content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .intro__text {
      font-family: var(--font-display);
      font-style: italic;
      font-size: clamp(0.9rem, 2vw, 1.05rem);
      color: var(--starlight);
      line-height: 1.5;
    }

    .intro__cta {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 162, 106, 0.16);
      border: 1px solid var(--emerald-soft);
      color: var(--emerald-soft);
      font-size: 0.8rem;
      letter-spacing: 0.04em;
      padding: 8px 18px;
      border-radius: 999px;
      transition: background 0.25s ease, color 0.25s ease;
    }

    .intro__cta:hover {
      background: var(--emerald);
      color: var(--void);
    }

    .intro__cta-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .video-card {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid rgba(127, 227, 184, 0.25);
      background: linear-gradient(160deg, rgba(16, 42, 31, 0.5), rgba(7, 21, 16, 0.5));
      scroll-margin-top: 24px;
    }

    .video-card--vertical {
      max-width: 320px;
    }

    .video-frame {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
    }

    .video-frame--vertical {
      aspect-ratio: 9 / 16;
    }

    .video-frame iframe,
    .video-frame video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: #000;
      object-fit: contain;
    }

    .video-placeholder {
      aspect-ratio: 16 / 9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: var(--space-md);
      text-align: center;
    }

    .signal {
      position: relative;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
    }

    .signal__dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--gold);
      box-shadow: 0 0 12px 3px rgba(231, 178, 95, 0.7);
      z-index: 1;
    }

    .signal__ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1px solid rgba(231, 178, 95, 0.5);
      animation: ripple 2.4s ease-out infinite;
    }

    .signal__ring--delay {
      animation-delay: 1.2s;
    }

    @keyframes ripple {
      0% { transform: scale(0.3); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    .video-placeholder__title {
      font-family: var(--font-display);
      font-size: 1.1rem;
      color: var(--starlight);
    }

    .video-placeholder__text {
      font-size: 0.85rem;
      color: var(--muted);
      max-width: 320px;
    }

    @media (max-width: 520px) {
      .intro { flex-direction: column; text-align: center; }
      .intro__cta { align-self: center; }
    }
  `]
})
export class VideoSectionComponent {
  @Input() name = '';
  @Input() introPhotoSrc = '';
  @Input() introText = 'Cada línea de código cuenta una historia, haz clic para saber parte de la mía.';

  /** Ruta a un archivo de video propio (ej: 'assets/videos/presentacion.mp4'). Tiene prioridad sobre videoUrl. */
  @Input() videoSrc: string | null = null;
  /** Imagen mostrada antes de reproducir el video propio (opcional). */
  @Input() posterSrc: string | null = null;
  /** Si el video es vertical (formato Short/reel), ajusta el marco a 9:16 en vez de 16:9. */
  @Input() vertical = false;

  @Input() set videoUrl(url: string | null | undefined) {
    this.embedUrl = url ? this.buildEmbedUrl(url) : null;
  }

  @ViewChild('videoAnchor') videoAnchor?: ElementRef<HTMLDivElement>;

  embedUrl: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  scrollToVideo(): void {
    this.videoAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private buildEmbedUrl(url: string): SafeResourceUrl {
    let embed = url;
    const ytMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]+)/
    );
    if (ytMatch) {
      embed = `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  }
}