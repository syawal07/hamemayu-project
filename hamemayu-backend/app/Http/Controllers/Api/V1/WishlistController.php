<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\WishlistRepositoryInterface;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function __construct(private WishlistRepositoryInterface $wishlistRepository)
    {
    }

    public function index(Request $request)
    {
        $wishlists = $this->wishlistRepository->getUserWishlists($request->user()->id);
        
        // FORMAT RESPONSE AGAR FRONTEND MUDAH PAKAI
        $formattedData = $wishlists->map(function($wishlist) {
            $item = [
                'id' => $wishlist->id,
                'user_id' => $wishlist->user_id,
                'notes' => $wishlist->notes,
                'visited' => $wishlist->visited,
                'priority' => $wishlist->priority,
                'created_at' => $wishlist->created_at,
                'updated_at' => $wishlist->updated_at,
            ];
            
            // Ambil data dari polymorphic relation (prioritas)
            if ($wishlist->plannable) {
                $item['plannable'] = [
                    'id' => $wishlist->plannable->id,
                    'title' => $wishlist->plannable->title,
                    'slug' => $wishlist->plannable->slug ?? null,
                    'image' => $wishlist->plannable->image ?? $wishlist->plannable->cover_image ?? null,
                    'category' => $wishlist->plannable->category?->name ?? $wishlist->plannable->category ?? null,
                    'type' => get_class($wishlist->plannable),
                ];
            } elseif ($wishlist->content) {
                // Fallback untuk backward compatibility
                $item['plannable'] = [
                    'id' => $wishlist->content->id,
                    'title' => $wishlist->content->title,
                    'slug' => $wishlist->content->slug,
                    'image' => $wishlist->content->cover_image ?? null,
                    'category' => $wishlist->content->category?->name ?? null,
                    'type' => 'App\Models\Content',
                ];
            }
            
            return $item;
        });
    
        return response()->json([
            'success' => true,
            'data' => $formattedData
        ]);
    }



    public function store(Request $request)
    {
        // VALIDASI POLYMORPHIC
        $data = $request->validate([
            'content_id' => 'nullable|exists:contents,id',
            'event_id'   => 'nullable|exists:events,id',
            'notes' => 'nullable|string',
            'visited' => 'boolean',
            'priority' => 'integer'
        ]);

        // Pastikan salah satu ada
        if (empty($data['content_id']) && empty($data['event_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'content_id atau event_id harus diisi.'
            ], 422);
        }

        // PASS userId KE REPOSITORY
        $wishlist = $this->wishlistRepository->createWishlist(
            $request->user()->id, // userId parameter pertama
            $data                 // data parameter kedua
        );

        return response()->json([
            'success' => true,
            'message' => 'Ditambahkan ke wishlist!',
            'data' => $wishlist
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'notes' => 'nullable|string',
            'visited' => 'boolean',
            'priority' => 'integer'
        ]);

        $wishlist = $this->wishlistRepository->updateWishlist($id, $request->user()->id, $data);

        return response()->json([
            'success' => true,
            'message' => 'Wishlist diupdate!',
            'data' => $wishlist
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $this->wishlistRepository->deleteWishlist($id, $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Dihapus dari wishlist.'
        ]);
    }

    public function destroyBulk(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:wishlists,id'
        ]);

        $this->wishlistRepository->deleteBulk($data['ids'], $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Data wishlist terpilih berhasil dihapus.'
        ]);
    }
}