export interface Category {
  id: number;
  name: string;
  slug: string;
  type: string;
  order: number;
  contents_count?: number;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface ContentInfo {
  opening_hours?: string;
  ticket_price?: string;
}

export interface Content {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: Category;
  location: Location;
  info: ContentInfo;
  is_featured: boolean;
  cover_image: string;
  status: string;
}

export interface Feature {
  id: number;
  title: string;
  description: string;
  image: string | null;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SiteSettings {
  site_name?: string;
  site_logo?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_background?: string;
  footer_text?: string;
  social_links?: SocialLink[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  google_id?: string;
}