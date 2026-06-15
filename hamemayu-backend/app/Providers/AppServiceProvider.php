<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\CategoryRepository;
use App\Repositories\Contracts\ContentRepositoryInterface;
use App\Repositories\ContentRepository;
use App\Repositories\Contracts\WishlistRepositoryInterface;
use App\Repositories\WishlistRepository;
use App\Repositories\Contracts\ItineraryRepositoryInterface;
use App\Repositories\ItineraryRepository;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(CategoryRepositoryInterface::class, CategoryRepository::class);
        $this->app->bind(ContentRepositoryInterface::class, ContentRepository::class);
        $this->app->bind(WishlistRepositoryInterface::class, WishlistRepository::class);
        $this->app->bind(ItineraryRepositoryInterface::class, ItineraryRepository::class);
    }

    public function boot(): void
    {
    }
}