<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'type',
        'order'
    ];

    protected static function booted(): void
    {
        $clearCache = function () {
            Cache::forget('categories_all');
            Cache::flush();
        };

        static::saved($clearCache);
        static::deleted($clearCache);
    }

    public function contents()
    {
        return $this->hasMany(Content::class);
    }
}