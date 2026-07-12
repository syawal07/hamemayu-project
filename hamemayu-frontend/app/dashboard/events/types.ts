export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface EventItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  description?: string;
  image?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location: string;
  is_free: boolean;
  price?: number;
  category: Category;
  registered_count?: number;
  quota?: number;
}

export interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  events: EventItem[];
  isToday: boolean;
}

export interface EventDatePopupProps {
  day: CalendarDay;
  position: { x: number; y: number };
  onClose: () => void;
  onEventSelect?: (event: EventItem) => void;
}