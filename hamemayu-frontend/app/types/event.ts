export type EventCategory = 'culture' | 'concert' | 'sports' | 'exhibition' | 'festival' | 'social' | 'other';
export type EventStatus = 'upcoming' | 'ongoing' | 'past';

export interface Event {
  id: number;
  slug: string;
  title: string;
  category: EventCategory;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  ticket_price: number;
  is_active: boolean;
  status: EventStatus;
  image: string | null;
  description?: string;
  location_address?: string | null;
  location_lat?: string | null;
  location_lng?: string | null;
  ticket_link?: string | null;
  quota?: number | null;
  registered_count?: number | null;
  is_registered_count_unknown?: boolean;
  organizer_name?: string | null;
  organizer_contact?: string | null;
  map_embed_url?: string | null;
  gallery?: string[];
}

export interface CalendarDay {
  date: string;
  day: number;
  events: Array<{
    id: number;
    slug: string;
    title: string;
    image: string | null;
    category: EventCategory;
    time: string;
  }>;
}