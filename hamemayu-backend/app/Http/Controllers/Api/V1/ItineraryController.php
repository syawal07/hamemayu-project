<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ItineraryRepositoryInterface;
use Illuminate\Http\Request;

class ItineraryController extends Controller
{
    public function __construct(private ItineraryRepositoryInterface $itineraryRepository)
    {
    }

    public function generate(Request $request)
    {
        $preferences = $request->validate([
            'days' => 'required|integer|min:1|max:7',
            'interests' => 'nullable|array',
            'use_wishlist' => 'nullable|boolean',
            'budget' => 'nullable|string'
        ]);

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
            'days' => 'required|integer|min:1|max:7',
            'budget_type' => 'nullable|string',
            'total_destinations' => 'required|integer',
            'estimated_budget' => 'nullable|string',
            'itinerary_data' => 'required|array',
            'itinerary_data.summary' => 'required|array',
            'itinerary_data.summary.total_days' => 'required|integer',
            'itinerary_data.summary.total_destinations' => 'required|integer',
            'itinerary_data.summary.highlights' => 'required|array',
            'itinerary_data.days' => 'required|array',
            'itinerary_data.days.*.day' => 'required|integer',
            'itinerary_data.days.*.slots' => 'required|array',
            'itinerary_data.days.*.slots.*.title' => 'required|string',
            'itinerary_data.days.*.slots.*.time_slot' => 'required|string',
        ]);

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
            // Cari itinerary berdasarkan ID dan user_id (security check)
            $itinerary = \App\Models\Itinerary::where('user_id', auth()->id())->findOrFail($id);
            
            // Update hanya field yang dikirim dan valid
            $fillableFields = ['title', 'days', 'budget_type', 'total_destinations', 'estimated_budget'];
            foreach ($fillableFields as $field) {
                if ($request->has($field)) {
                    $itinerary->$field = $request->input($field);
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
            // Log error untuk debugging
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