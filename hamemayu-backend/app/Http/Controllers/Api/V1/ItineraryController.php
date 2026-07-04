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
        // Validasi baru: start_date & end_date wajib, days optional (auto-calculate)
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'days' => 'nullable|integer|min:1|max:30',  // Optional, akan di-override
            'budget_type' => 'nullable|string',
            'total_destinations' => 'required|integer',
            'estimated_budget' => 'nullable|string',
            'itinerary_data' => 'required|array',
            'itinerary_data.summary' => 'required|array',
            'itinerary_data.summary.total_days' => 'nullable|integer',
            'itinerary_data.summary.total_destinations' => 'required|integer',
            'itinerary_data.summary.highlights' => 'required|array',
            'itinerary_data.days' => 'required|array',
            'itinerary_data.days.*.day' => 'required|integer',
            'itinerary_data.days.*.slots' => 'required|array',
            'itinerary_data.days.*.slots.*.title' => 'required|string',
            'itinerary_data.days.*.slots.*.time_slot' => 'required|string',
        ]);

        // Auto-calculate days dari rentang tanggal
        $startDate = Carbon::parse($data['start_date']);
        $endDate = Carbon::parse($data['end_date']);
        $data['days'] = $startDate->diffInDays($endDate) + 1;

        // Update summary.total_days juga biar konsisten
        if (isset($data['itinerary_data']['summary'])) {
            $data['itinerary_data']['summary']['total_days'] = $data['days'];
        }

        $itinerary = $this->itineraryRepository->saveItinerary($request->user()->id, $data);

        return response()->json([
            'success' => true,
            'message' => 'Itinerary berhasil disimpan!',
            'data' => $itinerary
        ], 201);
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
}