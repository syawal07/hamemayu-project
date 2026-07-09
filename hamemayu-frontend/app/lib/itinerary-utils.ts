import { fetchAPI } from './api';

export type DestWithCoords = {
  lat: number;
  lng: number;
  title: string;
  content_id?: number;
};

export interface MapMarker {
  id: number;
  lat: number | null;
  lng: number | null;
  title: string;
}

export interface WishlistItem {
  content?: {
    id: number;
    title: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export interface ItinerarySlot {
  content_id?: number;
  title?: string;
}

export interface ItineraryDay {
  slots?: ItinerarySlot[];
}

export interface ItineraryData {
  itinerary_data?: {
    days?: ItineraryDay[];
  };
}

export async function extractWishlistCoords(wishlist: WishlistItem[]): Promise<DestWithCoords[]> {
  if (!Array.isArray(wishlist)) {
    return [];
  }
  
  const itemsWithLocation = wishlist.flatMap((item) => {
    const content = item.content;
    if (!content) return [];
    
    if (content.location?.lat && content.location?.lng) {
      return {
        lat: content.location.lat,
        lng: content.location.lng,
        title: content.title,
        content_id: content.id,
      };
    }
    return [];
  });

  if (itemsWithLocation.length === wishlist.length) {
    return itemsWithLocation;
  }

  const missingIds = wishlist
    .filter(item => !item.content?.location?.lat || !item.content?.location?.lng)
    .map(item => item.content?.id)
    .filter((id): id is number => id !== undefined);

  if (missingIds.length === 0) {
    return itemsWithLocation;
  }

  try {
    const markers = await fetchAPI<MapMarker[]>('/map-markers') || [];
    
    const fallbackCoords = markers
      .filter(m => missingIds.includes(m.id) && m.lat !== null && m.lng !== null)
      .map(m => ({
        lat: m.lat as number,
        lng: m.lng as number,
        title: m.title,
        content_id: m.id,
      }));

    return [...itemsWithLocation, ...fallbackCoords];
  } catch (err) {
    return itemsWithLocation;
  }
}

export async function extractItineraryCoords(
  itinerary: ItineraryData
): Promise<DestWithCoords[]> {
  const contentIds: number[] = [];
  const slotTitles: string[] = [];
  
  itinerary.itinerary_data?.days?.forEach((day) => {
    day.slots?.forEach((slot) => {
      if (slot.content_id) {
        contentIds.push(slot.content_id);
      }
      if (slot.title) {
        slotTitles.push(slot.title.trim());
      }
    });
  });

  if (contentIds.length === 0 && slotTitles.length === 0) {
    return [];
  }

  try {
    const markers = await fetchAPI<MapMarker[]>('/map-markers') || [];
    
    const result: DestWithCoords[] = [];
    const usedMarkerIds = new Set<number>();

    markers.forEach(marker => {
      if (contentIds.includes(marker.id) && marker.lat !== null && marker.lng !== null) {
        result.push({
          lat: marker.lat,
          lng: marker.lng,
          title: marker.title,
          content_id: marker.id,
        });
        usedMarkerIds.add(marker.id);
      }
    });

    slotTitles.forEach(slotTitle => {
      const matchedMarker = markers.find(marker => {
        if (usedMarkerIds.has(marker.id)) return false;
        
        const markerTitle = marker.title.toLowerCase().trim();
        const searchTitle = slotTitle.toLowerCase().trim();
        
        return markerTitle === searchTitle || markerTitle.includes(searchTitle) || searchTitle.includes(markerTitle);
      });

      if (matchedMarker && matchedMarker.lat !== null && matchedMarker.lng !== null) {
        result.push({
          lat: matchedMarker.lat,
          lng: matchedMarker.lng,
          title: matchedMarker.title,
          content_id: matchedMarker.id,
        });
        usedMarkerIds.add(matchedMarker.id);
      }
    });

    return result;
    
  } catch (err) {
    return [];
  }
}