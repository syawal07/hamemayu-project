<?php

namespace App\Services;

use App\Repositories\Contracts\ContentRepositoryInterface;

class ContentService
{
    protected $contentRepository;

    public function __construct(ContentRepositoryInterface $contentRepository)
    {
        $this->contentRepository = $contentRepository;
    }

    public function getContentsList($request)
    {
        $perPage = 12;
        $categorySlug = $request->query('category');
        $search = $request->query('search');

        return $this->contentRepository->getPaginated($perPage, $categorySlug, $search);
    }

    public function getSingleContent($slug)
    {
        return $this->contentRepository->findBySlug($slug);
    }

    public function getFeaturedContents()
    {
        return $this->contentRepository->getFeatured();
    }

    public function getMapMarkers()
    {
        return $this->contentRepository->getMapMarkers();
    }
}