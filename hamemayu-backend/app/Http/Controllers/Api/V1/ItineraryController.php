<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ItineraryRepositoryInterface;
use Illuminate\Http\Request;
use Carbon\Carbon; // IMPORT INI WAJIB

class ItineraryController extends Controller
{
    public function __construct(private ItineraryRepositoryInterface $itineraryRepository)
    {
    }

    public function generate(Request $request)
    {
        // Validasi baru: terima start_date & end_date (days optional, akan auto-calculate)
        $preferences = $request->validate([
            'start_date' => 'required|date',              // Format: YYYY-MM-DD HH:mm:ss
            'end_date' => 'required|date|after_or_equal:start_date',
            'days' => 'nullable|integer|min:1|max:30',    // Optional, bakal di-override kalau start/end ada
            'interests' => 'nullable|array',
            'use_wishlist' => 'nullable|boolean',
            'budget' => 'nullable|string',
            'mode' => 'nullable|string|in:ai,manual',     // Untuk fitur generate manual nanti
        ]);

        // Auto-calculate days dari rentang tanggal (jika start_date & end_date ada)
        if (!empty($preferences['start_date']) && !empty($preferences['end_date'])) {
            $startDate = Carbon::parse($preferences['start_date']);
            $endDate = Carbon::parse($preferences['end_date']);
            $preferences['days'] = $startDate->diffInDays($endDate) + 1;
        }

        $result = $this->itineraryRepository->generateItinerary($preferences);

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    public function store(Request $request)
    {
        // ✅ LOG RAW INPUT
        \Log::info('Itinerary Save Request', [
            'user_id' => $request->user()->id,
            'all_input' => $request->all(),
            'json_input' => json_decode($request->getContent(), true),
        ]);
    
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'days' => 'nullable|integer|min:1|max:30',
            'budget_type' => 'nullable|string',
            'total_destinations' => 'nullable|integer',
            'estimated_budget' => 'nullable|string',
            'itinerary_data' => 'required|array',
            'itinerary_data.summary' => 'nullable|array',
            'itinerary_data.days' => 'required|array',
            'itinerary_data.days.*.day' => 'required|integer',
            'itinerary_data.days.*.slots' => 'required|array',
            'itinerary_data.days.*.slots.*.title' => 'required|string',
            'itinerary_data.days.*.slots.*.time_slot' => 'required|string',
        ], [
            'start_date.required' => 'Tanggal mulai wajib diisi',
            'end_date.required' => 'Tanggal selesai wajib diisi',
            'itinerary_data.days.required' => 'Data hari wajib diisi',
            'itinerary_data.days.*.slots.*.title.required' => 'Judul destinasi wajib diisi',
        ]);
    
        try {
            $startDate = Carbon::parse($data['start_date']);
            $endDate = Carbon::parse($data['end_date']);
            $data['days'] = $startDate->diffInDays($endDate) + 1;
        } catch (\Exception $e) {
            \Log::error('Date Parse Error', ['error' => $e->getMessage(), 'data' => $data]);
            return response()->json([
                'success' => false,
                'message' => 'Format tanggal tidak valid',
                'errors' => ['start_date' => ['Format harus YYYY-MM-DD HH:mm:ss']]
            ], 422);
        }
    
        if (isset($data['itinerary_data']['summary'])) {
            $data['itinerary_data']['summary']['total_days'] = $data['days'];
        } else {
            $data['itinerary_data']['summary'] = [
                'total_days' => $data['days'],
                'total_destinations' => $data['total_destinations'] ?? 0,
                'estimated_total_budget' => $data['estimated_budget'] ?? 'Rp 0',
                'highlights' => [],
            ];
        }
    
        try {
            $itinerary = $this->itineraryRepository->saveItinerary($request->user()->id, $data);
    
            return response()->json([
                'success' => true,
                'message' => 'Itinerary berhasil disimpan!',
                'data' => $itinerary
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Itinerary Save Failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $data
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan: ' . $e->getMessage(),
                'errors' => ['general' => [$e->getMessage()]]
            ], 500);
        }
    }

    public function history(Request $request)
    {
        $history = $this->itineraryRepository->getUserHistory($request->user()->id);

        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }

    public function show(Request $request, int $id)
    {
        $itinerary = $this->itineraryRepository->getItineraryDetail($id, $request->user()->id);

        return response()->json([
            'success' => true,
            'data' => $itinerary
        ]);
    }

    public function update(Request $request, $id)
    {
        try {
            $itinerary = \App\Models\Itinerary::where('user_id', auth()->id())->findOrFail($id);
            
            // Update field yang boleh diubah (termasuk start_date & end_date)
            $fillableFields = ['title', 'start_date', 'end_date', 'days', 'budget_type', 'total_destinations', 'estimated_budget'];
            foreach ($fillableFields as $field) {
                if ($request->has($field)) {
                    $itinerary->$field = $request->input($field);
                }
            }
            
            // Auto-recalculate days kalau start/end di-update
            if ($request->has('start_date') || $request->has('end_date')) {
                if ($itinerary->start_date && $itinerary->end_date) {
                    $itinerary->days = $itinerary->start_date->diffInDays($itinerary->end_date) + 1;
                }
            }
            
            // Handle itinerary_data (JSON) secara khusus
            if ($request->has('itinerary_data')) {
                $itinerary->itinerary_data = $request->input('itinerary_data');
            }
            
            $itinerary->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Itinerary berhasil diupdate!',
                'data' => $itinerary
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Itinerary Update Failed', [
                'id' => $id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'payload' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    // ✅ Method untuk DELETE full itinerary
    public function destroy(Request $request, int $id)
    {
        try {
            $itinerary = \App\Models\Itinerary::where('user_id', $request->user()->id)->findOrFail($id);
            $itinerary->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Itinerary berhasil dihapus.'
            ]);
        } catch (\Exception $e) {
            \Log::error('Itinerary Delete Failed', [
                'id' => $id,
                'user_id' => $request->user()->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getWeatherForecast(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'nullable|string'
        ]);
        
        $startDate = \Carbon\Carbon::parse($request->start_date);
        $endDate = \Carbon\Carbon::parse($request->end_date);
        $days = $startDate->diffInDays($endDate) + 1;
        
        $weatherData = [];
        $apiKey = env('OPENWEATHER_API_KEY');
        
        // Kalau API key nggak ada, return dummy data
        if (!$apiKey) {
            \Log::warning('OPENWEATHER_API_KEY not set!');
            for ($i = 0; $i < $days; $i++) {
                $currentDate = $startDate->copy()->addDays($i);
                $weatherData[] = [
                    'date' => $currentDate->format('Y-m-d'),
                    'day_name' => $currentDate->isoFormat('dddd'),
                    'temp' => rand(26, 32),
                    'description' => 'Berawan',
                    'icon' => '02d',
                    'humidity' => 75,
                    'wind_speed' => 5,
                ];
            }
            return response()->json(['success' => true, 'data' => $weatherData]);
        }
        
        // Call OpenWeatherMap 5-day forecast API
        try {
            $lat = -7.7956; // Yogyakarta
            $lon = 110.3695;
            
            $response = Http::get("https://api.openweathermap.org/data/2.5/forecast", [
                'lat' => $lat,
                'lon' => $lon,
                'appid' => $apiKey,
                'units' => 'metric',
                'lang' => 'id'
            ]);
            
            if ($response->successful()) {
                $apiData = $response->json();
                $listData = $apiData['list'] ?? [];
                
                // Group API data by date (YYYY-MM-DD)
                $dailyMap = [];
                foreach ($listData as $item) {
                    $date = \Carbon\Carbon::parse($item['dt_txt'])->format('Y-m-d');
                    if (!isset($dailyMap[$date])) {
                        $dailyMap[$date] = [];
                    }
                    $dailyMap[$date][] = $item;
                }
                
                // Build response for EACH day in itinerary
                for ($i = 0; $i < $days; $i++) {
                    $currentDate = $startDate->copy()->addDays($i);
                    $dateStr = $currentDate->format('Y-m-d');
                    
                    if (isset($dailyMap[$dateStr]) && count($dailyMap[$dateStr]) > 0) {
                        // Ambil data sekitar tengah hari (index 4 = ~12:00)
                        $samples = $dailyMap[$dateStr];
                        $middayIndex = min(4, count($samples) - 1);
                        $dayData = $samples[$middayIndex];
                        
                        $weatherData[] = [
                            'date' => $dateStr,
                            'day_name' => $currentDate->isoFormat('dddd'),
                            'temp' => round($dayData['main']['temp']),
                            'description' => $dayData['weather'][0]['description'],
                            'icon' => $dayData['weather'][0]['icon'],
                            'humidity' => $dayData['main']['humidity'],
                            'wind_speed' => $dayData['wind']['speed'],
                        ];
                    } else {
                        // Data nggak tersedia untuk tanggal ini
                        $weatherData[] = [
                            'date' => $dateStr,
                            'day_name' => $currentDate->isoFormat('dddd'),
                            'temp' => null,
                            'description' => null,
                            'icon' => null,
                            'humidity' => null,
                            'wind_speed' => null,
                        ];
                    }
                }
            } else {
                \Log::error('Weather API failed: ' . $response->status());
                // Return dummy data on API error
                for ($i = 0; $i < $days; $i++) {
                    $currentDate = $startDate->copy()->addDays($i);
                    $weatherData[] = [
                        'date' => $currentDate->format('Y-m-d'),
                        'day_name' => $currentDate->isoFormat('dddd'),
                        'temp' => rand(26, 32),
                        'description' => 'Berawan',
                        'icon' => '02d',
                        'humidity' => 75,
                        'wind_speed' => 5,
                    ];
                }
            }
        } catch (\Exception $e) {
            \Log::error('Weather API Exception: ' . $e->getMessage());
            // Return dummy data on exception
            for ($i = 0; $i < $days; $i++) {
                $currentDate = $startDate->copy()->addDays($i);
                $weatherData[] = [
                    'date' => $currentDate->format('Y-m-d'),
                    'day_name' => $currentDate->isoFormat('dddd'),
                    'temp' => rand(26, 32),
                    'description' => 'Berawan',
                    'icon' => '02d',
                    'humidity' => 75,
                    'wind_speed' => 5,
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => $weatherData
        ]);
    }

}