import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

type RecipeBlogVariant = 'teaser' | 'page';

@Component({
  selector: 'app-recipe-blog',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recipe-blog.component.html',
  styleUrls: ['./recipe-blog.component.css'],
})
export class RecipeBlogComponent {
  @Input()
  variant: RecipeBlogVariant = 'teaser';
}
