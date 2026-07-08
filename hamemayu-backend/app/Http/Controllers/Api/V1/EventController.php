<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\EventItineraryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    public function __construct(protected EventItineraryService $itineraryService) {}

    // ✅ 1. LIST EVENTS + FILTER & SORTING
    public function index(Request $request)
    {
        $query = Event::where('is_active', true);

        // Filter Status
        if ($request->filled('status')) {
            $now = now();
            $query->where(function ($q) use ($request, $now) {
                if ($request->status === 'ongoing') {
                    $q->where('start_date', '<=', $now)->where(fn ($sq) => $sq->whereNull('end_date')->orWhere('end_date', '>=', $now));
                } elseif ($request->status === 'upcoming') {
                    $q->where('start_date', '>', $now);
                } elseif ($request->status === 'past') {
                    $q->where('end_date', '<', $now);
                }
            });
        }

        // Filter Bulan/Tahun
        if ($request->filled('month') && $request->filled('year')) {
            $query->where(function ($q) use ($request) {
                $q->whereYear('start_date', $request->year)->whereMonth('start_date', $request->month)
                  ->orWhere(fn ($sq) => $sq->whereNotNull('end_date')->whereYear('end_date', $request->year)->whereMonth('end_date', $request->month));
            });
        }

        // Filter Kategori
        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q->where('title', 'like', "%{$search}%")->orWhere('location_name', 'like', "%{$search}%"));
        }

        // Sorting
        $sortField = in_array($request->sort, ['start_date', 'ticket_price', 'title', 'created_at']) ? $request->sort : 'start_date';
        $query->orderBy($sortField, $request->direction === 'asc' ? 'asc' : 'desc');

        $events = $query->paginate($request->per_page ?? 12);

        // Transform Response
        $events->getCollection()->transform(fn ($e) => $this->formatEvent($e));

        return response()->json($events);
    }

    // ✅ 2. CALENDAR DATA (Grouped by Date) - SEKARANG DENGAN FILTER
    public function calendar(Request $request)
    {
        $year = $request->year ?? now()->year;
        $month = $request->month ?? now()->month;
        
        // ✅ QUERY DASAR
        $query = Event::where('is_active', true)
            ->where(function ($q) use ($year, $month) {
                // Event yang mulai di bulan ini
                $q->whereYear('start_date', $year)
                ->whereMonth('start_date', $month)
                // ATAU event yang berakhir di bulan ini (multi-day events)
                ->orWhere(function ($sq) use ($year, $month) {
                    $sq->whereNotNull('end_date')
                        ->whereYear('end_date', $year)
                        ->whereMonth('end_date', $month);
                });
            });
        
        // ✅ FILTER KATEGORI (KALAU ADA)
        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }
        
        $events = $query->get();
        
        // ... (sisanya sama seperti sebelumnya)
        $grouped = [];
        foreach ($events as $e) {
            $start = $e->start_date->copy();
            $end = $e->end_date ? $e->end_date->copy() : $e->start_date->copy();
            
            while ($start->lte($end)) {
                $dateKey = $start->format('Y-m-d');
                $grouped[$dateKey][] = [
                    'id' => $e->id,
                    'slug' => $e->slug,
                    'title' => $e->title,
                    'image' => $e->image ? Storage::disk('public')->url($e->image) : null,
                    'category' => $e->category,
                    'time' => $e->start_time ? substr($e->start_time, 0, 5) : 'All Day'
                ];
                $start->addDay();
            }
        }
        
        // ... (generate calendar days tetap sama)
        $daysInMonth = \Carbon\Carbon::create($year, $month, 1)->daysInMonth;
        $calendarDays = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dateStr = sprintf('%04d-%02d-%02d', $year, $month, $day);
            $calendarDays[] = [
                'date' => $dateStr,
                'day' => $day,
                'events' => $grouped[$dateStr] ?? []
            ];
        }
        
        return response()->json(['year' => $year, 'month' => $month, 'days' => $calendarDays]);
    }

    // ✅ 3. DETAIL EVENT
    public function show($slug)
    {
        $event = Event::where('slug', $slug)->where('is_active', true)->firstOrFail();
        return response()->json($this->formatEvent($event, true));
    }

    // ✅ 4. CHECK ITINERARY CONFLICT
    public function checkConflict(Request $request, $eventId)
    {
        $request->validate([
            'itinerary_id' => 'required|exists:itineraries,id',
            'scheduled_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time'
        ]);

        $conflict = $this->itineraryService->checkOverlap(
            $request->itinerary_id,
            $request->scheduled_date,
            $request->start_time,
            $request->end_time,
            excludePlannableId: $eventId,
            excludePlannableType: Event::class
        );

        return response()->json([
            'has_conflict' => $conflict !== null,
            'conflict_with' => $conflict ? ['id' => $conflict->id, 'title' => $conflict->title ?? 'Item Lain'] : null,
            'message' => $conflict ? 'Jadwal bentrok dengan itinerary lain.' : 'Jadwal aman.'
        ]);
    }

    // HELPER: Format Event Response (SAFE VERSION)
    private function formatEvent(Event $event, bool $detailed = false): array
    {
        // Helper function buat format date safely
        $safeDate = fn($value, $format = 'Y-m-d') => $value ? (is_string($value) ? $value : $value->format($format)) : null;
        $safeTime = fn($value) => $value ? (is_string($value) ? substr($value, 0, 5) : $value->format('H:i')) : null;

        $base = [
            'id' => $event->id,
            'slug' => $event->slug,
            'title' => $event->title,
            'category' => $event->category,
            'start_date' => $safeDate($event->start_date),
            'end_date' => $safeDate($event->end_date),
            'start_time' => $safeTime($event->start_time),
            'end_time' => $safeTime($event->end_time),
            'location_name' => $event->location_name,
            'ticket_price' => $event->ticket_price ? (float) $event->ticket_price : 0.00,
            'is_active' => $event->is_active,
            'status' => $event->status, // Ini dari accessor Model, aman
            'image' => $event->image ? Storage::disk('public')->url($event->image) : null,
        ];

        if ($detailed) {
            $base = array_merge($base, [
                'description' => $event->description,
                'location_address' => $event->location_address,
                'location_lat' => $event->location_lat,
                'location_lng' => $event->location_lng,
                'ticket_link' => $event->ticket_link,
                'quota' => $event->quota,
                'registered_count' => $event->registered_count,
                'is_registered_count_unknown' => $event->is_registered_count_unknown,
                'organizer_name' => $event->organizer_name,
                'organizer_contact' => $event->organizer_contact,
                'map_embed_url' => $event->map_embed_url,
                'gallery' => $event->gallery ? collect($event->gallery)
                    ->map(function ($img) {
                        // Kalau $img adalah array, ambil value pertama atau skip
                        if (is_array($img)) {
                            $img = $img['url'] ?? $img[0] ?? null;
                        }
                        // Kalau $img string & bukan URL lengkap, generate URL storage
                        if (is_string($img) && !str_starts_with($img, 'http')) {
                            return Storage::disk('public')->url($img);
                        }
                        return $img; // Return as-is kalau udah URL lengkap
                    })
                    ->filter() // Hapus null values
                    ->values()
                    ->toArray() : [],
            ]);
        }

        return $base;
    }
}