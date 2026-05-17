export interface BlogImage {
  src: string;
  alt: string;
}

export interface BlogLink {
  label: string;
  href: string;
  ariaLabel?: string;
  download?: string;
  external?: boolean;
}

export interface BlogPost {
  title: string;
  slug: string;
  eyebrow: string;
  date: string;
  summary: string;
  heroImage: BlogImage;
  recipeTitle: string;
  submittedBy?: string;
  recipeCredit?: string;
  body: string[];
  recipeNotes: string[];
  sourceRecipe?: BlogLink;
  recipeDownload?: BlogLink;
  recipeSenseiImport?: BlogLink;
  recipeSenseiApp?: BlogLink;
  importNote?: string;
  galleryTitle?: string;
  gallery: BlogImage[];
}
