<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ContentController;
use App\Http\Controllers\Api\V1\WishlistController;
use App\Http\Controllers\Api\V1\ItineraryController;
use App\Http\Controllers\Api\V1\ChatController;
use App\Models\SiteSetting;
use App\Models\Feature;
use App\Models\Faq;

Route::prefix('v1')->group(function () {

    Route::get('/settings', function () {
        return response()->json([
            'status' => 'success',
            'data' => SiteSetting::query()->first()
        ]);
    });

    Route::get('/features', function () {
        return response()->json([
            'status' => 'success',
            'data' => Feature::query()->where('is_active', true)->orderBy('order', 'asc')->get()
        ]);
    });

    Route::get('/faqs', function () {
        return response()->json([
            'status' => 'success',
            'data' => Faq::query()->where('is_active', true)->orderBy('order', 'asc')->get()
        ]);
    });

    Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle']);
    Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/contents', [ContentController::class, 'index']);
    Route::get('/contents/featured', [ContentController::class, 'featured']);
    Route::get('/contents/{slug}', [ContentController::class, 'show']);
    Route::get('/map-markers', [ContentController::class, 'mapMarkers']);

    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get('/user/profile', function (Request $request) {
            return response()->json([
                'success' => true,
                'data' => $request->user()
            ]);
        });

        Route::get('/wishlist', [WishlistController::class, 'index']);
        Route::post('/wishlist', [WishlistController::class, 'store']);
        Route::put('/wishlist/{id}', [WishlistController::class, 'update']);
        Route::delete('/wishlist/{id}', [WishlistController::class, 'destroy']);

        Route::post('/itinerary/generate', [ItineraryController::class, 'generate']);
        Route::post('/itinerary/save', [ItineraryController::class, 'store']);
        Route::get('/itinerary/history', [ItineraryController::class, 'history']);
        Route::get('/itinerary/history/{id}', [ItineraryController::class, 'show']);
        Route::put('/itinerary/history/{id}', [ItineraryController::class, 'update']);
        Route::delete('/wishlist/bulk', [WishlistController::class, 'destroyBulk']);

        Route::post('/chat', [ChatController::class, 'chat']);

    });

});