import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recipe-blog',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recipe-blog.component.html',
  styleUrls: ['./recipe-blog.component.css'],
})
export class RecipeBlogComponent {}
