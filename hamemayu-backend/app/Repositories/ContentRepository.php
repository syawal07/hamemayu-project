<?php

namespace App\Repositories;

use App\Models\Content;
use App\Repositories\Contracts\ContentRepositoryInterface;

class ContentRepository implements ContentRepositoryInterface
{
    public function getPaginated(int $perPage = 12, ?string $categorySlug = null, ?string $search = null)
    {
        $query = Content::with('category')->where('status', 'published');

        if ($categorySlug) {
            $query->whereHas('category', function ($q) use ($categorySlug) {
                $q->where('slug', $categorySlug);
            });
        }

        if ($search) {
            $query->where('title', 'like', '%' . $search . '%');
        }

        return $query->paginate($perPage);
    }

    public function findBySlug(string $slug)
    {
        return Content::with('category')
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();
    }

    public function getFeatured(int $limit = 4)
    {
        return Content::with('category')
            ->where('is_featured', true)
            ->where('status', 'published')
            ->limit($limit)
            ->get();
    }

    public function getMapMarkers()
    {
        return Content::query()->where('status', 'published')
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->with('category:id,name,slug')
            ->select(['id', 'title', 'slug', 'lat', 'lng', 'category_id'])
            ->get();
    }
}