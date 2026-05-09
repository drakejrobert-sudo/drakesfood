import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { blogPosts } from '../../data/blog-posts.data';

@Component({
  selector: 'app-blog-post-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './blog-post-page.component.html',
  styleUrls: ['./blog-post-page.component.css'],
})
export class BlogPostPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly post =
    blogPosts.find((blogPost) => blogPost.slug === this.route.snapshot.paramMap.get('slug')) ??
    blogPosts[0];
}
