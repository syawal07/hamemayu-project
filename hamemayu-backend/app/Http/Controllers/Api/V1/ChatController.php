<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ChatController extends Controller
{
    public function __construct(private ChatService $chatService)
    {
    }

    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array',
            'history.*.role' => 'required|string|in:user,assistant',
            'history.*.content' => 'required|string',
            'session_id' => 'nullable|string',
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
            'area' => 'nullable|string|max:100',
        ]);

        $message = $validated['message'];
        $history = $validated['history'] ?? [];
        
        // Cache kini unik untuk setiap jalur percakapan
        $cacheKey = "halomayu_" . md5(json_encode($history) . $message);

        if ($cachedResponse = Cache::get($cacheKey)) {
            return response()->json($this->formatResponse($cachedResponse, $message));
        }

        // Tembak AI (Groq) beserta riwayat percakapan
        $aiResponse = $this->chatService->getAiResponse(
            $message, 
            $history,
            $validated['lat'] ?? null, 
            $validated['lng'] ?? null, 
            $validated['area'] ?? null
        );
        
        if ($aiResponse) {
            Cache::put($cacheKey, $aiResponse, 3600);
            return response()->json($this->formatResponse($aiResponse, $message));
        }

        // Fallback jika API mati
        $fallbackResponse = $this->chatService->getFallbackResponse($message);
        return response()->json($this->formatResponse($fallbackResponse, $message));
    }

    private function formatResponse(string $message, string $originalQuery): array
    {
        return [
            'success' => true,
            'data' => [
                'bot_name' => 'HaloMayu',
                'message' => $message,
                'timestamp' => now()->toISOString(),
                'suggestions' => [
                    'Ada rekomendasi kuliner lain?',
                    'Berapa harga tiket masuknya?',
                    'Buatkan rencana liburan sehari',
                ],
                'is_ai_generated' => (bool) env('GROQ_API_KEY'),
                'maps' => $this->chatService->extractMapsLink($message),
            ],
        ];
    }
}