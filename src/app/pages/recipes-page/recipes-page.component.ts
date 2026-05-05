import { Component } from '@angular/core';
import { RecipeBlogComponent } from '../../components/recipe-blog/recipe-blog.component';

@Component({
  selector: 'app-recipes-page',
  standalone: true,
  imports: [RecipeBlogComponent],
  templateUrl: './recipes-page.component.html',
})
export class RecipesPageComponent {}
