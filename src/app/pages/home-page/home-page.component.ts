import { Component } from '@angular/core';
import { AboutComponent } from '../../components/about/about.component';
import { GalleryPreviewComponent } from '../../components/gallery-preview/gallery-preview.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { InstagramCtaComponent } from '../../components/instagram-cta/instagram-cta.component';
import { RecipeBlogComponent } from '../../components/recipe-blog/recipe-blog.component';
import { RecipeSubmissionComponent } from '../../components/recipe-submission/recipe-submission.component';
import { RecipeSenseiComponent } from '../../components/recipe-sensei/recipe-sensei.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    HeroComponent,
    GalleryPreviewComponent,
    InstagramCtaComponent,
    AboutComponent,
    RecipeSenseiComponent,
    RecipeSubmissionComponent,
    RecipeBlogComponent,
  ],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {}
