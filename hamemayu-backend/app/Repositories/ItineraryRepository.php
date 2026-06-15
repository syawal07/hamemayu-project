<?php

namespace App\Repositories;

use App\Models\Itinerary;
use App\Models\Content;
use App\Models\Category;
use App\Repositories\Contracts\ItineraryRepositoryInterface;

class ItineraryRepository implements ItineraryRepositoryInterface
{
    public function generateItinerary(array $preferences)
    {
        $days = $preferences['days'] ?? 1;
        $budgetType = $preferences['budget'] ?? 'normal';
        $interests = $preferences['interests'] ?? [];
        
        // 1. Identifikasi Kategori Kuliner secara terpisah
        $kulinerCat = Category::query()->where('slug', 'kuliner')->first();
        $kulinerId = $kulinerCat ? $kulinerCat->id : 0;

        $categoryIds = Category::query()->whereIn('slug', $interests, 'and', false)->pluck('id');

        // 2. Tarik Data Kuliner (Selalu ditarik sebagai stok makanan)
        $foodQuery = Content::query()->where('status', 'published');
        if ($kulinerId) {
            $foodQuery->where('category_id', $kulinerId);
        } else {
            // Fallback: Jika kategori kuliner belum rapi, cari tempat yang ada unsur makanan/minuman
            $foodQuery->where(function($q) {
                $q->where('title', 'like', '%soto%')
                  ->orWhere('title', 'like', '%kopi%')
                  ->orWhere('title', 'like', '%gudeg%')
                  ->orWhere('title', 'like', '%padang%')
                  ->orWhere('title', 'like', '%warung%');
            });
        }
        $foods = $foodQuery->inRandomOrder()->get();

        // 3. Tarik Data Wisata/Eksplorasi (Berdasarkan minat user)
        $attrQuery = Content::query()->where('status', 'published');
        if ($categoryIds->count() > 0) {
            $attrQuery->whereIn('category_id', $categoryIds->toArray(), 'and', false);
        }
        if ($kulinerId) {
            // Pastikan slot wisata tidak disusupi tempat makan
            $attrQuery->where('category_id', '!=', $kulinerId); 
        }
        $attractions = $attrQuery->inRandomOrder()->get();

        // Gabungan untuk fallback jika salah satu data kosong
        $allDestinations = $attractions->merge($foods);
        
        if ($allDestinations->count() === 0) {
            abort(404, 'Tidak ada destinasi yang tersedia di pangkalan data.');
        }

        $itineraryDays = [];
        $highlights = [];
        
        // Index berputar agar tidak kehabisan data jika harinya panjang
        $foodIndex = 0;
        $attrIndex = 0;

        for ($i = 1; $i <= $days; $i++) {
            $slots = [];
            
            // Blueprint jadwal harian yang logis & akurat
            $slotBlueprints = [
                ['time' => 'SARAPAN & PAGI (07:30 - 10:00)', 'type' => 'food'],
                ['time' => 'EKSPLORASI SIANG (10:30 - 13:00)', 'type' => 'attr'],
                ['time' => 'MAKAN & BERSANTAI (13:30 - 15:30)', 'type' => 'food'],
                ['time' => 'MENIKMATI SENJA (16:00 - 18:30)', 'type' => 'attr'],
                ['time' => 'KULINER MALAM (19:00 - 21:30)', 'type' => 'food'],
            ];

            foreach ($slotBlueprints as $bp) {
                $place = null;

                // Memetakan Tipe Slot ke Sumber Data yang Tepat
                if ($bp['type'] === 'food' && $foods->count() > 0) {
                    $place = $foods->get($foodIndex % $foods->count());
                    $foodIndex++;
                } elseif ($bp['type'] === 'attr' && $attractions->count() > 0) {
                    $place = $attractions->get($attrIndex % $attractions->count());
                    $attrIndex++;
                } else {
                    // Fallback aman: Comot apa saja jika data spesifik kosong
                    $place = $allDestinations->random();
                }

                $slots[] = [
                    'time_slot' => $bp['time'],
                    'title' => $place->title,
                    'content_id' => $place->id
                ];

                if (count($highlights) < 4 && !in_array($place->title, $highlights)) {
                    $highlights[] = $place->title;
                }
            }

            $themes = [
                'Eksplorasi Budaya & Rasa', 
                'Jejak Sejarah Mataram', 
                'Petualangan Alam Tropis', 
                'Menyatu dengan Warga Lokal'
            ];
            $theme = $themes[array_rand($themes)] . ' - Hari ' . $i;

            $itineraryDays[] = [
                'day' => $i,
                'theme' => $theme,
                'slots' => $slots,
                'transport_tip' => 'Gunakan TransJogja untuk dalam kota, atau sewa motor untuk menjangkau spot tersembunyi dengan lincah.'
            ];
        }

        // Kalkulasi Anggaran
        $totalNeeded = $days * 5;
        $budgetMultiplier = match($budgetType) {
            'hemat' => 30000,
            'normal' => 85000,
            'mewah' => 250000,
            default => 85000,
        };
        
        $baseTotal = $totalNeeded * $budgetMultiplier;
        $minBudget = number_format($baseTotal * 0.8, 0, ',', '.');
        $maxBudget = number_format($baseTotal * 1.3, 0, ',', '.');

        return [
            'summary' => [
                'total_days' => $days,
                'total_destinations' => min($totalNeeded, $allDestinations->unique('id')->count()),
                'estimated_total_budget' => "Rp {$minBudget} - Rp {$maxBudget}",
                'highlights' => $highlights
            ],
            'days' => $itineraryDays
        ];
    }

    public function saveItinerary(int $userId, array $data)
    {
        $data['user_id'] = $userId;
        return Itinerary::create($data);
    }

    public function getUserHistory(int $userId)
    {
        return Itinerary::query()
            ->where('user_id', $userId)
            ->select('id', 'title', 'days', 'created_at')
            ->latest()
            ->get();
    }

    public function getItineraryDetail(int $id, int $userId)
    {
        return Itinerary::query()
            ->where('id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();
    }
}