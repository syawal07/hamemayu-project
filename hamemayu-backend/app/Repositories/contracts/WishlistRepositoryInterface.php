<?php

namespace App\Repositories\Contracts;

interface WishlistRepositoryInterface
{
    public function getUserWishlists(int $userId);
    public function createWishlist(int $userId, array $data);
    public function updateWishlist(int $id, int $userId, array $data);
    public function deleteWishlist(int $id, int $userId);
    public function deleteBulk(array $ids, int $userId);
}