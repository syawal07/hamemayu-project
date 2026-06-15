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

        return response()->json([
            'success' => true,
            'data' => $wishlists
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'content_id' => 'required|exists:contents,id',
            'notes' => 'nullable|string',
            'visited' => 'boolean',
            'priority' => 'integer'
        ]);

        $wishlist = $this->wishlistRepository->createWishlist($request->user()->id, $data);

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