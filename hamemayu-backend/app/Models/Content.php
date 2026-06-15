<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Content extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'lat',
        'lng',
        'info',
        'is_featured',
        'cover_image',
        'status'
    ];

    protected $casts = [
        'info' => 'array',
        'is_featured' => 'boolean',
        'lat' => 'float',
        'lng' => 'float',
    ];

    protected static function booted(): void
    {
        $clearCache = function ($content) {
            Cache::forget('contents_featured');
            Cache::forget('contents_map_markers');
            Cache::forget('content_show_' . $content->slug);
            Cache::flush();
        };

        static::saved($clearCache);
        static::deleted($clearCache);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function scopeSearch(Builder $query, string $term): void
    {
        $term = "%{$term}%";
        $query->where(function ($q) use ($term) {
            $q->where('title', 'like', $term)
              ->orWhere('excerpt', 'like', $term);
        });
    }
}