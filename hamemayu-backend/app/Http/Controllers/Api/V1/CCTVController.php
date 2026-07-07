<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\CCTVStreamExtractor;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Response;

class CCTVController extends Controller
{
    public function __construct(protected CCTVStreamExtractor $extractor) {}

    public function getCameras()
    {
        $data = $this->extractor->getCameraStreams();
        return response()->json([
            'success' => true,
            'data' => $data,
            'cached' => cache()->has('cctv_streams'),
            'last_updated' => now()->toIso8601String()
        ]);
    }

    public function refresh()
    {
        $data = $this->extractor->forceRefresh();
        return response()->json(['success' => true, 'data' => $data]);
    }

    // ✅ PROXY STREAM (Bypass CORS & Referrer)
    public function proxyStream($cameraId)
    {
        $cameras = $this->extractor->getCameraStreams();
        $camera = collect($cameras)->firstWhere('id', $cameraId);

        if (!$camera || !$camera['stream_url']) {
            return response()->json(['success' => false, 'message' => 'Stream not found'], 404);
        }

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer' => 'https://cctv.jogjakota.go.id/',
                'Origin' => 'https://cctv.jogjakota.go.id',
            ])->get($camera['stream_url']);

            return Response::make($response->body(), 200, [
                'Content-Type' => 'application/vnd.apple.mpegurl',
                'Access-Control-Allow-Origin' => '*',
                'Cache-Control' => 'no-cache',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Proxy failed: ' . $e->getMessage()], 500);
        }
    }
}