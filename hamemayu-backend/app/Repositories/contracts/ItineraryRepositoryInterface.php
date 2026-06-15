<?php

namespace App\Repositories\Contracts;

interface ItineraryRepositoryInterface
{
    public function generateItinerary(array $preferences);
    public function saveItinerary(int $userId, array $data);
    public function getUserHistory(int $userId);
    public function getItineraryDetail(int $id, int $userId);
}