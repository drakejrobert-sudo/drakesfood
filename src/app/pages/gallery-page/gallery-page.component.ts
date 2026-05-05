import { Component } from '@angular/core';
import { galleryItems } from '../../data/gallery.data';

@Component({
  selector: 'app-gallery-page',
  standalone: true,
  templateUrl: './gallery-page.component.html',
  styleUrls: ['./gallery-page.component.css'],
})
export class GalleryPageComponent {
  galleryItems = galleryItems;
  categories = Array.from(new Set(galleryItems.map((item) => item.category)));
}
