<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ContentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ContentController extends Controller
{
    protected ContentService $contentService;

    public function __construct(ContentService $contentService)
    {
        $this->contentService = $contentService;
    }

    public function index(Request $request)
    {
        $cacheKey = 'contents_page_' . $request->query('page', 1) . 
                    '_cat_' . $request->query('category', 'all') . 
                    '_search_' . $request->query('search', 'none');

        $data = Cache::remember($cacheKey, 3600, function () use ($request) {
            return $this->contentService->getContentsList($request);
        });

        return response()->json($data);
    }

    public function featured()
    {
        $data = Cache::remember('contents_featured', 3600, function () {
            return $this->contentService->getFeaturedContents();
        });

        return response()->json(['data' => $data]);
    }

    public function show(string $slug)
    {
        $data = Cache::remember('content_show_' . $slug, 3600, function () use ($slug) {
            return $this->contentService->getSingleContent($slug);
        });

        return response()->json(['data' => $data]);
    }

    public function mapMarkers()
    {
        $data = Cache::remember('contents_map_markers', 3600, function () {
            return $this->contentService->getMapMarkers();
        });

        return response()->json($data);
    }
}