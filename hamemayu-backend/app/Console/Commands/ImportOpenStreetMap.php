<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use App\Models\Content;
use App\Models\Category;

class ImportOpenStreetMap extends Command
{
    protected $signature = 'osm:import {--keyword=} {--category=kuliner} {--limit=30}';
    protected $description = 'Import places from OpenStreetMap (Nominatim) for Yogyakarta';
    
    private $yogyaBounds = '110.1,-8.2,110.7,-7.6';

    public function handle()
    {
        $keyword = $this->option('keyword');
        if (!$keyword) {
            $this->error('Gunakan: php artisan osm:import --keyword="hotel"');
            return 1;
        }

        $categorySlug = $this->option('category');
        $limit = (int) $this->option('limit');
        $this->info("Mencari '{$keyword}' di Yogyakarta via OpenStreetMap...");

        $response = Http::timeout(10)->get('https://nominatim.openstreetmap.org/search', [
            'q' => "{$keyword} Yogyakarta",
            'format' => 'json',
            'limit' => $limit,
            'viewbox' => $this->yogyaBounds,
            'bounded' => 1,
            'addressdetails' => 1,
        ]);

        if (!$response->successful()) {
            $this->error("API Error: HTTP " . $response->status());
            return 1;
        }

        $places = $response->json();
        if (empty($places)) {
            $this->warn('Tidak ada hasil ditemukan.');
            return 0;
        }

        $category = new Category();
        $catData = $category->firstOrCreate(
            ['slug' => $categorySlug],
            ['name' => ucfirst($categorySlug), 'type' => 'pilar']
        );

        $saved = 0;
        $skipped = 0;

        foreach ($places as $place) {
            if ($saved >= $limit) break;

            $lat = (float) $place['lat'];
            $lon = (float) $place['lon'];
            $rawName = $place['name'] ?? $place['display_name'] ?? 'Unknown';
            $name = $this->cleanName($rawName);

            $addressStr = strtolower($place['display_name'] ?? '');
            if (!str_contains($addressStr, 'yogyakarta') && !str_contains($addressStr, 'diy')) {
                $skipped++; continue;
            }

            $isDuplicate = Content::where('title', $name)
                ->orWhere(function($q) use ($lat, $lon) {
                    $q->where('lat', '>=', $lat - 0.0001)
                      ->where('lat', '<=', $lat + 0.0001)
                      ->where('lng', '>=', $lon - 0.0001)
                      ->where('lng', '<=', $lon + 0.0001);
                })->count() > 0;

            if ($isDuplicate) {
                $skipped++; continue;
            }

            $addressParts = explode(',', $place['display_name'] ?? '');
            $shortAddress = trim(implode(',', array_slice($addressParts, -3))) ?: 'Yogyakarta';

            Content::create([
                'category_id'     => $catData->id,
                'title'           => $name,
                'slug'            => Str::slug($name) . '-' . Str::random(4),
                'excerpt'         => $shortAddress,
                'content'         => "<p>{$name} adalah destinasi di Yogyakarta.</p>",
                'lat'             => $lat,
                'lng'             => $lon,
                'cover_image'     => null,
                'opening_hours'   => null,
                'ticket_price'    => null,
                'is_featured'     => false,
                'status'          => 'published',
            ]);

            $saved++;
            $this->line("{$saved}. {$name}");
            sleep(1);
        }

        $this->info("\n Selesai! Tersimpan: {$saved}, Dilewati: {$skipped}");
        return 0;
    }

    private function cleanName(string $name): string
    {
        return trim(preg_replace('/[^\x20-\x7E]/u', '', $name));
    }
}