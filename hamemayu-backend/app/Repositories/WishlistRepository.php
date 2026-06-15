<?php

namespace App\Repositories;

use App\Models\Wishlist;
use App\Repositories\Contracts\WishlistRepositoryInterface;

class WishlistRepository implements WishlistRepositoryInterface
{
    public function getUserWishlists(int $userId)
    {
        return Wishlist::query()
            ->with(['content.category'])
            ->where('user_id', '=', $userId)
            ->orderBy('priority', 'desc')
            ->latest()
            ->get();
    }

    public function createWishlist(int $userId, array $data)
    {
        $data['user_id'] = $userId;
        return Wishlist::create($data);
    }

    public function updateWishlist(int $id, int $userId, array $data)
    {
        $wishlist = Wishlist::query()
            ->where('id', '=', $id)
            ->where('user_id', '=', $userId)
            ->firstOrFail();
            
        $wishlist->update($data);
        
        return $wishlist->load('content.category');
    }

    public function deleteWishlist(int $id, int $userId)
    {
        Wishlist::query()
            ->where('id', '=', $id)
            ->where('user_id', '=', $userId)
            ->firstOrFail();
            
        return Wishlist::query()
            ->where('id', '=', $id)
            ->delete();
    }

    public function deleteBulk(array $ids, int $userId)
    {
        return Wishlist::query()
            ->whereIn('id', $ids)
            ->where('user_id', '=', $userId)
            ->delete();
    }
}