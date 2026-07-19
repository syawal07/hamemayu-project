<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ItineraryRepositoryInterface;
use Illuminate\Http\Request;
use Carbon\Carbon; 

class ItineraryController extends Controller
{
    public function __construct(private ItineraryRepositoryInterface $itineraryRepository)
    {
    }

    public function generate(Request $request)
    {
        $preferences = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'days' => 'nullable|integer|min:1|max:30',
            'interests' => 'nullable|array',
            'use_wishlist' => 'nullable|boolean',
            'budget' => 'nullable|string',
            'mode' => 'nullable|string|in:ai,manual',
        ]);

        if (!empty($preferences['start_date']) && !empty($preferences['end_date'])) {
            $startDate = Carbon::parse($preferences['start_date'])->startOfDay();
            $endDate = Carbon::parse($preferences['end_date'])->startOfDay();
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
            $startDate = Carbon::parse($data['start_date'])->startOfDay();
            $endDate = Carbon::parse($data['end_date'])->startOfDay();
            $data['days'] = $startDate->diffInDays($endDate) + 1;
        } catch (\Exception $e) {
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

    public function update(Request $request, int $id) // Perbaikan P1132: Menambahkan tipe 'int' pada $id
    {
        try {
            // Perbaikan P1013: Mengubah auth()->id() menjadi $request->user()->id
            $itinerary = \App\Models\Itinerary::where('user_id', $request->user()->id)->findOrFail($id);

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
                    $start = Carbon::parse($itinerary->start_date)->startOfDay();
                    $end = Carbon::parse($itinerary->end_date)->startOfDay();
                    $itinerary->days = $start->diffInDays($end) + 1;
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
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

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
        
        if (!$apiKey) {
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
        
        try {
            $lat = -7.7956;
            $lon = 110.3695;
            
            $response = \Illuminate\Support\Facades\Http::get("https://api.openweathermap.org/data/2.5/forecast", [
                'lat' => $lat,
                'lon' => $lon,
                'appid' => $apiKey,
                'units' => 'metric',
                'lang' => 'id'
            ]);
            
            if ($response->successful()) {
                $apiData = $response->json();
                $listData = $apiData['list'] ?? [];
                
                $dailyMap = [];
                foreach ($listData as $item) {
                    $date = \Carbon\Carbon::parse($item['dt_txt'])->format('Y-m-d');
                    if (!isset($dailyMap[$date])) {
                        $dailyMap[$date] = [];
                    }
                    $dailyMap[$date][] = $item;
                }
                
                for ($i = 0; $i < $days; $i++) {
                    $currentDate = $startDate->copy()->addDays($i);
                    $dateStr = $currentDate->format('Y-m-d');
                    
                    if (isset($dailyMap[$dateStr]) && count($dailyMap[$dateStr]) > 0) {
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