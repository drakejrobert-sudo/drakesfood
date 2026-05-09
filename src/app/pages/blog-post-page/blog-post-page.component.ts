import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogPost } from '../../data/blog-post.model';
import { blogPosts } from '../../data/blog-posts.data';

@Component({
  selector: 'app-blog-post-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './blog-post-page.component.html',
  styleUrls: ['./blog-post-page.component.css'],
})
export class BlogPostPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly post = signal<BlogPost | undefined>(undefined);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paramMap) => {
      const slug = paramMap.get('slug');
      const post = blogPosts.find((blogPost) => blogPost.slug === slug);

      if (!post) {
        this.post.set(undefined);
        void this.router.navigate(['/blog'], { replaceUrl: true });
        return;
      }

      this.post.set(post);
    });
  }
}
