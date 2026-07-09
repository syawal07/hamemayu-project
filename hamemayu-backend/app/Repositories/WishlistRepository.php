<?php

namespace App\Repositories;

use App\Models\Wishlist;
use App\Repositories\Contracts\WishlistRepositoryInterface;

class WishlistRepository implements WishlistRepositoryInterface
{
    public function getUserWishlists(int $userId)
    {
        return Wishlist::where('user_id', $userId)
            ->with(['content.category', 'plannable']) // ✅ Load kedua relasi
            ->latest()
            ->get();
    }

    public function createWishlist(int $userId, array $data)
    {
        // HANDLE EVENT_ID (Polymorphic)
        if (!empty($data['event_id'])) {
            return Wishlist::create([
                'user_id' => $userId,
                'content_id' => null,
                'plannable_type' => 'App\Models\Event',
                'plannable_id' => $data['event_id'],
                'notes' => $data['notes'] ?? null,
                'visited' => $data['visited'] ?? false,
                'priority' => $data['priority'] ?? 1,
            ]);
        }
        
        // HANDLE CONTENT_ID (Logic Lama)
        if (!empty($data['content_id'])) {
            return Wishlist::create([
                'user_id' => $userId,
                'content_id' => $data['content_id'],
                'plannable_type' => 'App\Models\Content',
                'plannable_id' => $data['content_id'],
                'notes' => $data['notes'] ?? null,
                'visited' => $data['visited'] ?? false,
                'priority' => $data['priority'] ?? 1,
            ]);
        }
        
        throw new \Exception('Invalid wishlist data: content_id or event_id required');
    }

    public function updateWishlist(int $id, int $userId, array $data)
    {
        $wishlist = Wishlist::query()
            ->where('id', '=', $id)
            ->where('user_id', '=', $userId)
            ->firstOrFail();
            
        $wishlist->update($data);
        
        return $wishlist->load('content.category', 'plannable');
    }

    public function deleteWishlist(int $id, int $userId)
    {
        return Wishlist::query()
            ->where('id', '=', $id)
            ->where('user_id', '=', $userId)
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