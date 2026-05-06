import { Component } from '@angular/core';
import { GalleryPreviewComponent } from '../../components/gallery-preview/gallery-preview.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { InstagramCtaComponent } from '../../components/instagram-cta/instagram-cta.component';
import { RecipeBlogComponent } from '../../components/recipe-blog/recipe-blog.component';
import { RecipeSenseiComponent } from '../../components/recipe-sensei/recipe-sensei.component';
import { SubmitIdeaCtaComponent } from '../../components/submit-idea-cta/submit-idea-cta.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    HeroComponent,
    GalleryPreviewComponent,
    InstagramCtaComponent,
    RecipeSenseiComponent,
    SubmitIdeaCtaComponent,
    RecipeBlogComponent,
  ],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {}
