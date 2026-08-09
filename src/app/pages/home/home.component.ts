import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortraitPanelComponent, FunFact } from '../../components/portrait-panel/portrait-panel.component';
import { VideoSectionComponent } from '../../components/video-section/video-section.component';
import { EvidenceGalleryComponent } from '../../components/evidence-gallery/evidence-gallery.component';
import { ContactSectionComponent } from '../../components/contact-section/contact-section.component';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

/**
 * Página de inicio del portafolio.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    PortraitPanelComponent,
    VideoSectionComponent,
    EvidenceGalleryComponent,
    ContactSectionComponent,
    RevealOnScrollDirective
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  readonly name = 'Nataly Vanessa Rengifo Bautista';

  readonly photoSrc = 'assets/images/foto-nataly.png';
  readonly avatarSrc = 'assets/images/avatar-nataly.png';
  readonly conocemePhotoSrc = 'assets/images/foto-conoceme.jpg';

  readonly videoIsVertical = true;
  
  readonly videoUrl: string | null = 'assets/videos/presentacion.mp4';

  readonly floatingTags = ['Ingeniería de Sistemas', 'Ingeniería Robótica', 'UEB'];

  readonly funFacts: FunFact[] = [
    { label: 'Color favorito', text: 'Mi color favorito es el verde esmeralda.' },
    { label: 'Cantante favorito', text: 'Mi cantante favorito es Nanpa Básico.' },
    { label: 'Mi sueño', text: 'Sueño con tener mi empresa de robótica y automatización médica.' },
    { label: 'Voluntariado', text: 'Me gusta hacer voluntariados hospitalarios y comunitarios.' },
    { label: 'Arte', text: 'Me gusta pintar en acrílico y el arte.' },
    { label: 'Idiomas', text: 'Me gusta aprender idiomas.' },
    { label: 'Viajes', text: 'Amo viajar.' },
    { label: 'Perfeccionismo', text: 'Soy muy perfeccionista.' },
    { label: 'Liderazgo', text: 'Destaco en liderar grupos.' }
  ];

  readonly social = {
    github: 'https://github.com/natar2005',
    institutionalEmail: 'nrengifob@unbosque.edu.co',
    personalEmail: 'natalyrengifo707@gmail.com'
  };
}
