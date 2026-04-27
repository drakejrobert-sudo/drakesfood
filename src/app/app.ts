import { Component } from '@angular/core';
import { AboutComponent } from './components/about/about.component';
import { FooterComponent } from './components/footer/footer.component';
import { GalleryPreviewComponent } from './components/gallery-preview/gallery-preview.component';
import { HeroComponent } from './components/hero/hero.component';
import { InstagramCtaComponent } from './components/instagram-cta/instagram-cta.component';
import { RecipeBlogComponent } from './components/recipe-blog/recipe-blog.component';
import { RecipeSenseiComponent } from './components/recipe-sensei/recipe-sensei.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeroComponent,
    GalleryPreviewComponent,
    InstagramCtaComponent,
    AboutComponent,
    RecipeSenseiComponent,
    RecipeBlogComponent,
    FooterComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {}
