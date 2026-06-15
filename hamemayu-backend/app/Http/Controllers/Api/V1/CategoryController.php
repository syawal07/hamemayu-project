<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\CategoryService;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    // Tambahkan tipe data CategoryService di sini
    protected CategoryService $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    public function index()
    {
        // Menyimpan response di memori Cache selama 3600 detik
        $data = Cache::remember('categories_all', 3600, function () {
            return $this->categoryService->getAllCategories();
        });

        return response()->json(['data' => $data]);
    }
}