import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogSubscriptionComponent } from '../blog-subscription/blog-subscription.component';
import { blogPosts, currentBlogPost } from '../../data/blog-posts.data';

@Component({
  selector: 'app-recipe-blog',
  standalone: true,
  imports: [RouterLink, BlogSubscriptionComponent],
  templateUrl: './recipe-blog.component.html',
  styleUrls: ['./recipe-blog.component.css'],
})
export class RecipeBlogComponent {
  protected readonly currentPost = currentBlogPost;
  protected readonly previousPosts = blogPosts.slice(1);
}
