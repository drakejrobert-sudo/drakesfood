import { Component } from '@angular/core';
import { RecipeSenseiComponent } from '../../components/recipe-sensei/recipe-sensei.component';

@Component({
  selector: 'app-recipesensei-page',
  standalone: true,
  imports: [RecipeSenseiComponent],
  templateUrl: './recipesensei-page.component.html',
})
export class RecipeSenseiPageComponent {}
