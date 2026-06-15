<?php

namespace App\Services;

use App\Models\Content;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatService
{
    public function getAiResponse(string $message, array $history = [], ?float $lat = null, ?float $lng = null, ?string $area = null): ?string
    {
        $apiKey = env('GROQ_API_KEY');
        if (!$apiKey) return null;

        $locationContext = "";
        if ($lat && $lng) {
            $locationContext = "\n\nKonteks Lokasi: User sedang berada di koordinat ({$lat}, {$lng}). Prioritaskan rekomendasi di area ini jika memungkinkan.";
        } elseif ($area) {
            $locationContext = "\n\nKonteks Lokasi: User berada di area {$area}.";
        }

        $systemPrompt = <<<PROMPT
Kamu adalah HaloMayu, asisten virtual cerdas untuk platform Nusantara Digital City, khusus wilayah Yogyakarta.

ATURAN SISTEM MUTLAK:
1. KAMU HANYA BOLEH MENJAWAB SEPUTAR YOGYAKARTA (Wisata, Kuliner, Sejarah, Budaya, Transportasi).
2. Jika user bertanya hal di luar Yogyakarta (misal: "tiket ke bali", "tempat wisata di bandung"), TOLAK DENGAN SOPAN dan ingatkan bahwa kamu hanya melayani area Jogja.
3. Jawablah kelanjutan obrolan (misal: "ada lagi?", "selain itu?") dengan melihat riwayat chat sebelumnya secara cerdas.
4. Gaya bahasa: Ramah, informatif, dan ringkas. Maksimal 3-4 kalimat.
5. WAJIB sertakan format persis "🗺️ Lokasi: [Nama Tempat]" di akhir kalimat jika memberikan rekomendasi tempat wisata atau restoran. Tulis nama tempat dengan lengkap.
{$locationContext}
PROMPT;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Masukkan riwayat percakapan sebelumnya
        foreach ($history as $msg) {
            if (isset($msg['role']) && isset($msg['content'])) {
                $messages[] = [
                    'role' => $msg['role'] === 'user' ? 'user' : 'assistant',
                    'content' => $msg['content']
                ];
            }
        }

        $messages[] = ['role' => 'user', 'content' => $message];

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->timeout(15)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.1-8b-instant',
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 350,
            ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content');
            }
        } catch (\Exception $e) {
            Log::error('Groq API Error: ' . $e->getMessage());
        }

        return null;
    }

    public function extractMapsLink(string $message): ?array
    {
        // Regex diperbarui untuk mengambil teks sampai baris baru (menghindari pemotongan titik jalan)
        if (preg_match('/Lokasi:\s*\[?([^\]\n\r]+)/iu', $message, $matches)) {
            $placeName = trim($matches[1], " .,");
            if (!empty($placeName) && strlen($placeName) > 2) {
                return $this->generateMapsLinkFromPlaceName($placeName);
            }
        }
        return null;
    }

    public function getFallbackResponse(string $message): string
    {
        $message = strtolower($message);
        $rules = [
            'kuliner' => ['makan', 'gudeg', 'angkringan'],
            'wisata' => ['wisata', 'destinasi', 'liburan'],
        ];

        foreach ($rules['kuliner'] as $kw) {
            if (str_contains($message, $kw)) return 'Untuk kuliner, Yogyakarta punya banyak pilihan otentik! Coba Gudeg Yuwono untuk rasa klasik. 🗺️ Lokasi: Gudeg Yuwono';
        }
        
        foreach ($rules['wisata'] as $kw) {
            if (str_contains($message, $kw)) return 'Banyak titik eksplorasi di sini! Keraton atau Pantai Parangtritis. Ingin lihat yang mana? 🗺️ Lokasi: Keraton Yogyakarta';
        }

        return "Salam eksplorasi! Saya HaloMayu. Saat ini koneksi ke otak AI sedang gangguan, namun saya siap memandu Anda ke tempat wisata utama Jogja.";
    }

    private function generateMapsLinkFromPlaceName(string $placeName): ?array
    {
        $placeName = trim($placeName, " .,;:!?\"'[]()");
        $lowerPlace = strtolower($placeName);

        $content = Content::query()
            ->where('status', 'published')
            ->where(function($q) use ($lowerPlace) {
                $q->whereRaw('LOWER(title) = ?', [$lowerPlace])
                  ->orWhereRaw('LOWER(title) LIKE ?', ["%{$lowerPlace}%"]);
            })
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->first();
        
        if ($content) {
            return [
                'label' => $content->title,
                'url' => "http://maps.google.com/?q={$content->lat},{$content->lng}",
                'source' => 'database',
            ];
        }
        
        return [
            'label' => $placeName,
            'url' => "http://maps.google.com/?q=" . urlencode($placeName . " Yogyakarta"),
            'source' => 'search',
        ];
    }
}