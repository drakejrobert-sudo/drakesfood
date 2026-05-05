import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recipe-sensei',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recipe-sensei.component.html',
  styleUrls: ['./recipe-sensei.component.css'],
})
export class RecipeSenseiComponent {}
