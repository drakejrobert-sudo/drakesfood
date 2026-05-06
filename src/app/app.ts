import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { FooterComponent } from './components/footer/footer.component';

const SITE_URL = 'https://drakesfood.com';
const DEFAULT_IMAGE_URL = `${SITE_URL}/assets/images/margaritaOoniPizza.jpeg`;
const DEFAULT_IMAGE_ALT = 'Margherita pizza fresh from the Ooni oven with melted mozzarella and basil';

interface PageMetadata {
  title: string;
  description: string;
  canonicalPath: string;
}

const PAGE_METADATA: Record<string, PageMetadata> = {
  '/': {
    title: "Drake's Food | Food Photography & Home Cooking",
    description:
      "Drake's Food is a warm, photo-first home for food photography, home cooking, Instagram updates, and RecipeSensei iOS app updates.",
    canonicalPath: '/',
  },
  '/gallery': {
    title: "Food Gallery | Drake's Food",
    description: "Browse Drake's Food photos, including smoked meats, backyard pizza, family meals, and home-cooking experiments.",
    canonicalPath: '/gallery',
  },
  '/recipes': {
    title: "Recipes & Stories | Drake's Food",
    description: "Follow future Drake's Food recipes, kitchen notes, food experiments, family favorites, and cooking stories.",
    canonicalPath: '/recipes',
  },
  '/submit': {
    title: "Submit a Recipe Idea | Drake's Food",
    description: "Send Drake a recipe idea, family dish, cooking challenge, or food link for possible future Drake's Food inspiration.",
    canonicalPath: '/submit',
  },
  '/recipesensei': {
    title: "RecipeSensei | Drake's Food",
    description: "RecipeSensei is Drake's recipe-saving and cooking companion app, available for iPhone and iPad on the App Store.",
    canonicalPath: '/recipesensei',
  },
  '/about': {
    title: "About | Drake's Food",
    description: "Learn about Drake's Food, a personal, photo-forward home for cooking, food photography, Instagram updates, and recipe ideas.",
    canonicalPath: '/about',
  },
  '/recipesensei/support': {
    title: "RecipeSensei Support | Drake's Food",
    description: 'Get support information for RecipeSensei, Drake\'s recipe-saving and cooking companion app.',
    canonicalPath: '/recipesensei/support',
  },
  '/recipesensei/privacy': {
    title: "RecipeSensei Privacy Policy | Drake's Food",
    description: 'Review the privacy policy for RecipeSensei, Drake\'s recipe-saving and cooking companion app.',
    canonicalPath: '/recipesensei/privacy',
  },
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FooterComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  constructor() {
    this.applyPageMetadata(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.applyPageMetadata(event.urlAfterRedirects));
  }

  private applyPageMetadata(url: string): void {
    const path = this.normalizePath(url);
    const metadata = PAGE_METADATA[path] ?? PAGE_METADATA['/'];
    const canonicalUrl = `${SITE_URL}${metadata.canonicalPath}`;

    this.title.setTitle(metadata.title);
    this.updateMetaTag('name', 'description', metadata.description);
    this.updateMetaTag('name', 'robots', 'index, follow');
    this.updateMetaTag('property', 'og:title', metadata.title);
    this.updateMetaTag('property', 'og:description', metadata.description);
    this.updateMetaTag('property', 'og:type', 'website');
    this.updateMetaTag('property', 'og:url', canonicalUrl);
    this.updateMetaTag('property', 'og:site_name', "Drake's Food");
    this.updateMetaTag('property', 'og:image', DEFAULT_IMAGE_URL);
    this.updateMetaTag('property', 'og:image:alt', DEFAULT_IMAGE_ALT);
    this.updateMetaTag('name', 'twitter:card', 'summary_large_image');
    this.updateMetaTag('name', 'twitter:title', metadata.title);
    this.updateMetaTag('name', 'twitter:description', metadata.description);
    this.updateMetaTag('name', 'twitter:image', DEFAULT_IMAGE_URL);
    this.updateMetaTag('name', 'twitter:image:alt', DEFAULT_IMAGE_ALT);
    this.updateCanonicalUrl(canonicalUrl);
  }

  private normalizePath(url: string): string {
    const path = url.split('?')[0].split('#')[0].replace(/\/$/, '');

    return path || '/';
  }

  private updateMetaTag(attributeName: 'name' | 'property', attributeValue: string, content: string): void {
    this.meta.updateTag({ [attributeName]: attributeValue, content }, `${attributeName}='${attributeValue}'`);
  }

  private updateCanonicalUrl(canonicalUrl: string): void {
    let canonicalLink = this.document.querySelector<HTMLLinkElement>("link[rel='canonical']");

    if (!canonicalLink) {
      canonicalLink = this.document.createElement('link');
      canonicalLink.rel = 'canonical';
      this.document.head.appendChild(canonicalLink);
    }

    canonicalLink.href = canonicalUrl;
  }
}
