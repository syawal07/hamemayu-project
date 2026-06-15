<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use App\Models\Content;
use App\Models\Category;

class ImportGooglePlaces extends Command
{
    protected $signature = 'places:import {--keyword=} {--category=kuliner} {--limit=30}';
    protected $description = 'Import places from Google Places API to Yogyakarta database';
    
    private $yogyaBounds = [
        'north' => -7.6,
        'south' => -8.2,
        'east'  => 110.7,
        'west'  => 110.1,
    ];

    public function handle()
    {
        $apiKey = env('GOOGLE_PLACES_API_KEY');
        if (!$apiKey) {
            $this->error(' Set GOOGLE_PLACES_API_KEY di file .env');
            return 1;
        }

        $keyword = $this->option('keyword');
        if (!$keyword) {
            $this->error('Gunakan: php artisan places:import --keyword="Gudeg"');
            return 1;
        }

        $categorySlug = $this->option('category');
        $limit = (int) $this->option('limit');
        $this->info("🔍 Searching: '{$keyword}' di Yogyakarta...");

        $allPlaces = [];
        $nextPageToken = null;
        $fetched = 0;

        do {
            $response = Http::get('https://maps.googleapis.com/maps/api/place/textsearch/json', [
                'query' => "{$keyword} Yogyakarta",
                'key' => $apiKey,
                'location' => '-7.7956,110.3695',
                'radius' => 25000,
                'pagetoken' => $nextPageToken,
            ]);

            if (!$response->successful()) {
                $this->error(" API Error: " . $response->body());
                return 1;
            }

            $data = $response->json();
            $results = $data['results'] ?? [];
            $allPlaces = array_merge($allPlaces, $results);
            $fetched += count($results);
            $nextPageToken = $data['next_page_token'] ?? null;

            if ($nextPageToken) sleep(2);
        } while ($nextPageToken && $fetched < $limit);

        // Menggunakan instance baru agar Intelephense tidak bingung
        $category = new Category();
        $catData = $category->firstOrCreate(
            ['slug' => $categorySlug],
            ['name' => ucfirst($categorySlug), 'type' => 'pilar']
        );

        $saved = 0;
        $skipped = 0;

        foreach ($allPlaces as $place) {
            if ($saved >= $limit) break;

            $lat = $place['geometry']['location']['lat'];
            $lng = $place['geometry']['location']['lng'];

            if (!$this->isInYogyakarta($lat, $lng)) {
                $skipped++; continue;
            }

            // Mengganti exists() dengan count() > 0 agar linter aman
            if (Content::where('google_place_id', $place['place_id'])->count() > 0) {
                $skipped++; continue;
            }

            $isDuplicate = Content::where('title', $place['name'])
                ->orWhere(function($q) use ($lat, $lng) {
                    $q->where('lat', '>=', $lat - 0.0001)
                      ->where('lat', '<=', $lat + 0.0001)
                      ->where('lng', '>=', $lng - 0.0001)
                      ->where('lng', '<=', $lng + 0.0001);
                })->count() > 0;

            if ($isDuplicate) {
                $skipped++; continue;
            }

            Content::create([
                'google_place_id' => $place['place_id'],
                'category_id'     => $catData->id,
                'title'           => $place['name'],
                'slug'            => Str::slug($place['name']) . '-' . Str::random(4),
                'excerpt'         => $place['formatted_address'] ?? 'Destinasi di Yogyakarta',
                'content'         => "<p>{$place['name']} adalah tempat populer di Yogyakarta.</p>",
                'lat'             => $lat,
                'lng'             => $lng,
                'cover_image'     => $this->getPhotoUrl($place, $apiKey),
                'info'            => [
                    'Jam Buka' => $this->formatHours($place['opening_hours'] ?? null),
                    'Estimasi Harga' => $this->formatPrice($place['price_level'] ?? null)
                ],
                'is_featured'     => ($place['rating'] ?? 0) >= 4.5,
                'status'          => 'published',
            ]);

            $saved++;
            $rating = $place['rating'] ?? 'N/A';
            $this->line("Ok {$saved}. {$place['name']} (⭐ {$rating})");
        }

        $this->info("\n Selesai! Tersimpan: {$saved}, Dilewati: {$skipped}");
        return 0;
    }

    private function isInYogyakarta(float $lat, float $lng): bool
    {
        return $lat >= $this->yogyaBounds['south'] && $lat <= $this->yogyaBounds['north']
            && $lng >= $this->yogyaBounds['west'] && $lng <= $this->yogyaBounds['east'];
    }

    private function getPhotoUrl(array $place, string $apiKey): ?string
    {
        if (empty($place['photos'])) return null;
        $ref = $place['photos'][0]['photo_reference'] ?? null;
        return $ref ? "https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={$ref}&key={$apiKey}" : null;
    }

    private function formatHours(?array $hours): ?string
    {
        if (!$hours || empty($hours['weekday_text'])) return null;
        return collect($hours['weekday_text'])->implode('; ');
    }

    private function formatPrice(?int $level): ?string
    {
        return match($level) {
            1 => 'Rp 5.000 - Rp 25.000',
            2 => 'Rp 25.000 - Rp 75.000',
            3 => 'Rp 75.000 - Rp 150.000',
            4 => 'Rp 150.000+',
            default => null,
        };
    }
}