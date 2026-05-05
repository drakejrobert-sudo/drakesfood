import { Component } from '@angular/core';
import { GalleryPreviewComponent } from '../../components/gallery-preview/gallery-preview.component';

@Component({
  selector: 'app-gallery-page',
  standalone: true,
  imports: [GalleryPreviewComponent],
  templateUrl: './gallery-page.component.html',
})
export class GalleryPageComponent {}
