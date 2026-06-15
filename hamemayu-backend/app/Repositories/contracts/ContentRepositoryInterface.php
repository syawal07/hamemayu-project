<?php

namespace App\Repositories\Contracts;

interface ContentRepositoryInterface
{
    public function getPaginated(int $perPage = 12, ?string $categorySlug = null, ?string $search = null);
    public function findBySlug(string $slug);
    public function getFeatured(int $limit = 4);
    public function getMapMarkers();
}