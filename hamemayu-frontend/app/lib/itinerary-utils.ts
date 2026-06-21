import { fetchAPI } from './api';

export type DestWithCoords = {
  lat: number;
  lng: number;
  title: string;
  content_id?: number;
};

/**
 * Extract koordinat dari Wishlist.
 * Fallback: Jika location tidak ada di response, fetch dari /map-markers via content_id.
 */
export async function extractWishlistCoords(wishlist: any[]): Promise<DestWithCoords[]> {
  console.log('🔍 WISHLIST DEBUG - Full data:', wishlist);
  
  if (!Array.isArray(wishlist)) {
    console.error('❌ Wishlist bukan array!');
    return [];
  }
  
  // 1. Cek apakah ada item yang PUNYA location langsung
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

  // Kalau semua item sudah punya lokasi, return langsung
  if (itemsWithLocation.length === wishlist.length) {
    console.log('✅ Semua item punya lokasi lokal.');
    return itemsWithLocation;
  }

  // 2. Fallback: Ambil content_id dari item yang TIDAK punya lokasi
  const missingIds = wishlist
    .filter(item => !item.content?.location?.lat || !item.content?.location?.lng)
    .map(item => item.content?.id)
    .filter(Boolean);

  if (missingIds.length === 0) {
    return itemsWithLocation;
  }

  console.log(`⚠️ ${missingIds.length} item nggak punya lokasi. Fetching /map-markers...`);

  try {
    const markers: any[] = await fetchAPI('/map-markers');
    
    const fallbackCoords = markers
      .filter(m => missingIds.includes(m.id) && m.lat && m.lng)
      .map(m => ({
        lat: m.lat,
        lng: m.lng,
        title: m.title,
        content_id: m.id,
      }));

    const result = [...itemsWithLocation, ...fallbackCoords];
    console.log('✅ HASIL FINAL EXTRACT:', result);
    return result;

  } catch (err) {
    console.error('❌ Failed to fetch map markers for fallback:', err);
    return itemsWithLocation;
  }
}

/**
 * Extract koordinat dari Itinerary.
 * PRIORITY: content_id → Fallback: match by title
 */
export async function extractItineraryCoords(
  itinerary: any
): Promise<DestWithCoords[]> {
  console.log('🔍 ITINERARY DEBUG - Full data:', itinerary);
  
  // 1. Kumpulkan content_id DAN title dari semua slots
  const contentIds: number[] = [];
  const slotTitles: string[] = [];
  
  itinerary.itinerary_data?.days?.forEach((day: any) => {
    day.slots?.forEach((slot: any) => {
      if (slot.content_id) {
        contentIds.push(slot.content_id);
      }
      if (slot.title) {
        slotTitles.push(slot.title.trim());
      }
    });
  });

  console.log('Content IDs yang ditemukan:', contentIds);
  console.log('Slot titles yang ditemukan:', slotTitles);

  if (contentIds.length === 0 && slotTitles.length === 0) {
    console.warn('⚠️ Nggak ada content_id atau title di itinerary');
    return [];
  }

  try {
    // 2. Fetch semua map markers
    console.log('📡 Fetching /map-markers...');
    const markers: any[] = await fetchAPI('/map-markers');
    console.log('Map markers:', markers);
    
    const result: DestWithCoords[] = [];
    const usedMarkerIds = new Set<number>();

    // 3. PRIORITAS 1: Match by content_id
    markers.forEach(marker => {
      if (contentIds.includes(marker.id) && marker.lat && marker.lng) {
        result.push({
          lat: marker.lat,
          lng: marker.lng,
          title: marker.title,
          content_id: marker.id,
        });
        usedMarkerIds.add(marker.id);
      }
    });

    // 4. PRIORITAS 2: Fallback - Match by title (case-insensitive)
    slotTitles.forEach(slotTitle => {
      // Cari marker yang title-nya cocok (abaikan case & spasi berlebih)
      const matchedMarker = markers.find(marker => {
        if (usedMarkerIds.has(marker.id)) return false; // Jangan pakai yang udah dipakai
        
        const markerTitle = marker.title.toLowerCase().trim();
        const searchTitle = slotTitle.toLowerCase().trim();
        
        return markerTitle === searchTitle || markerTitle.includes(searchTitle) || searchTitle.includes(markerTitle);
      });

      if (matchedMarker && matchedMarker.lat && matchedMarker.lng) {
        result.push({
          lat: matchedMarker.lat,
          lng: matchedMarker.lng,
          title: matchedMarker.title,
          content_id: matchedMarker.id,
        });
        usedMarkerIds.add(matchedMarker.id);
        console.log(`✅ Match by title: "${slotTitle}" → "${matchedMarker.title}"`);
      } else {
        console.warn(`⚠️ Nggak ketemu marker untuk title: "${slotTitle}"`);
      }
    });

    console.log('✅ HASIL FINAL EXTRACT ITINERARY:', result);
    return result;
    
  } catch (err) {
    console.error('❌ Failed to fetch map markers:', err);
    return [];
  }
}