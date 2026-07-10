<?php

namespace App\Services;

use App\Models\Itinerary;
use Carbon\Carbon;

class EventItineraryService
{
    public function checkOverlap(
        int $itineraryId,
        string $date,
        string $startTime,
        string $endTime,
        ?int $excludePlannableId = null,
        ?string $excludePlannableType = null
    ) {
        $itinerary = Itinerary::find($itineraryId);
        if (!$itinerary) return null;

        $targetStart = Carbon::parse("$date $startTime");
        $targetEnd = Carbon::parse("$date $endTime");

        // 1. Ambil data dari JSON field 'itinerary_data'
        $data = $itinerary->itinerary_data;
        if (is_string($data)) {
            $data = json_decode($data, true) ?? [];
        }

        // 2. Flatten data agar mudah di-loop
        // Handle struktur nested: [ { day: 1, activities: [...] } ]
        $activities = [];
        foreach ($data as $dayGroup) {
            if (isset($dayGroup['activities']) && is_array($dayGroup['activities'])) {
                $activities = array_merge($activities, $dayGroup['activities']);
            } else {
                // Handle struktur flat: [ { title: "...", ... } ]
                $activities[] = $dayGroup;
            }
        }

        // 3. Loop cek overlap
        foreach ($activities as $act) {
            $actDate = $act['date'] ?? null;
            $actStart = $act['start_time'] ?? null;
            $actEnd = $act['end_time'] ?? null;

            if (!$actDate || !$actStart || !$actEnd) continue;

            // Skip item yang sama (saat edit event)
            $actId = $act['plannable_id'] ?? null;
            $actType = $act['plannable_type'] ?? null;
            if ($excludePlannableId && $excludePlannableType) {
                if ($actId == $excludePlannableId && $actType === $excludePlannableType) {
                    continue;
                }
            }

            // Cek tanggal
            if ($actDate !== $date) continue;

            // Cek waktu overlap: (StartA <= EndB) && (EndA >= StartB)
            $itemStart = Carbon::parse("$actDate $actStart");
            $itemEnd = Carbon::parse("$actDate $actEnd");

            if ($targetStart->lte($itemEnd) && $targetEnd->gte($itemStart)) {
                return (object) [
                    'id' => $act['id'] ?? 'unknown',
                    'title' => $act['title'] ?? 'Item Lain',
                    'type' => $act['type'] ?? 'activity'
                ];
            }
        }

        return null; // Aman
    }
}