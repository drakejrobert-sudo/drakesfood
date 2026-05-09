export interface BlogImage {
  src: string;
  alt: string;
}

export interface BlogLink {
  label: string;
  href: string;
}

export interface BlogPost {
  title: string;
  slug: string;
  eyebrow: string;
  date: string;
  summary: string;
  heroImage: BlogImage;
  body: string[];
  recipeNotes: string[];
  sourceRecipe: BlogLink;
  recipeSenseiImport: BlogLink;
  gallery: BlogImage[];
}
