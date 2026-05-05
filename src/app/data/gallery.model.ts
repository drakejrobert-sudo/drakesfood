export interface GalleryItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  cardImageUrl: string;
  altText: string;
  caption?: string;
  cookedDate?: string;
  instagramUrl?: string;
}
