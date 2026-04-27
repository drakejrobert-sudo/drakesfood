import { Component } from '@angular/core';
import { galleryItems } from '../../data/gallery.data';

@Component({
  selector: 'app-gallery-preview',
  standalone: true,
  templateUrl: './gallery-preview.component.html',
  styleUrls: ['./gallery-preview.component.css'],
})
export class GalleryPreviewComponent {
  galleryItems = galleryItems;
}
