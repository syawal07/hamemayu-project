<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Spatie\Browsershot\Browsershot;

class CCTVStreamExtractor
{
    protected $baseUrl = 'https://cctv.jogjakota.go.id';
    protected $cacheDuration = 180; // 3 menit (stream URL bisa expired)

    public function getCameraStreams()
    {
        return Cache::remember('cctv_streams', $this->cacheDuration, function () {
            return $this->extractStreamsViaPuppeteer();
        });
    }

    protected function extractStreamsViaPuppeteer()
    {
        $streams = [];
        $foundUrls = [];

        try {
            // Gunakan Browsershot dengan custom JS untuk intercept network
            $html = Browsershot::url($this->baseUrl)
                ->setNodeBinary('/usr/bin/node') // Sesuaikan path node di VPS
                ->setNpmBinary('/usr/bin/npm')
                ->waitUntilNetworkIdle(3000)
                ->timeout(45000)
                ->setOption('args', ['--no-sandbox', '--disable-setuid-sandbox'])
                ->bodyHtml();

            // Extract m3u8 URLs dari HTML/JS
            preg_match_all('/(https?:\/\/[^\s\'"]+\.m3u8[^\s\'"]*)/', $html, $matches);
            $foundUrls = array_unique($matches[1]);

            // Mapping kamera (bisa disesuaikan dengan struktur site)
            $locations = [
                'Malioboro', 'Titik Nol KM', 'Keraton', 'Alun-Alun Utara',
                'Stasiun Tugu', 'Terminal Giwangan', 'Bandara', 'Tugu Jogja'
            ];

            foreach ($foundUrls as $index => $url) {
                $streams[] = [
                    'id' => (string)($index + 1),
                    'name' => $locations[$index] ?? 'CCTV ' . ($index + 1),
                    'location' => 'Yogyakarta',
                    'stream_url' => $url,
                    'last_updated' => now()->toIso8601String(),
                ];
            }

            Log::info('CCTV: Extracted ' . count($streams) . ' streams');

        } catch (\Exception $e) {
            Log::error('CCTV Extraction Failed: ' . $e->getMessage());
            // Fallback ke data statis kalau gagal
            $streams = $this->getFallbackData();
        }

        return empty($streams) ? $this->getFallbackData() : $streams;
    }

    protected function getFallbackData()
    {
        return [
            ['id' => '1', 'name' => 'Malioboro', 'location' => 'Jl. Malioboro', 'stream_url' => null],
            ['id' => '2', 'name' => 'Titik Nol KM', 'location' => 'Titik Nol', 'stream_url' => null],
        ];
    }

    public function forceRefresh()
    {
        Cache::forget('cctv_streams');
        return $this->getCameraStreams();
    }
}