export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface MapMarker {
  id: number;
  title: string;
  lat: number | string;
  lng: number | string;
}

export interface WishlistItem {
  id: number;
  title?: string;
  category?: string | { name: string };
  notes?: string;
  content?: {
    id: number;
    title: string;
    category?: { name: string };
  };
  plannable?: {
    id: number;
    title: string;
    category?: string;
  };
}

export interface SearchResultItem {
  id: number;
  title: string;
  type: 'destination' | 'event';
  category: { name: string };
  excerpt?: string;
}

export interface ManualDestination {
  id: number;
  title: string;
  content_id: number;
  category: string;
  assigned_day?: number;
  assigned_time?: string;
}

export interface ItinerarySlot {
  title: string;
  time_slot: string;
  content_id?: number;
  notes?: string;
}

export interface ItineraryDay {
  day: number;
  theme?: string;
  slots: ItinerarySlot[];
  transport_tip?: string;
}

export interface ItinerarySummary {
  total_days: number;
  total_destinations: number;
  estimated_total_budget: string;
  highlights: string[];
}

export interface ItineraryGenerateResponse {
  summary: ItinerarySummary;
  days?: ItineraryDay[];
}

export interface ItineraryHistory {
  id: number;
  title: string;
  start_date?: string;
  end_date?: string;
  days: number;
  created_at?: string;
  total_destinations?: number;
}

export interface ItineraryDetail extends ItineraryHistory {
  budget_type: string;
  estimated_budget: string;
  itinerary_data: {
    summary: ItinerarySummary;
    days: ItineraryDay[];
  };
}