import { Component, inject } from '@angular/core';
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly post: BlogPost | undefined = this.findPost();

  private findPost(): BlogPost | undefined {
    const slug = this.route.snapshot.paramMap.get('slug');
    const post = blogPosts.find((blogPost) => blogPost.slug === slug);

    if (!post) {
      void this.router.navigate(['/blog'], { replaceUrl: true });
    }

    return post;
  }
}
