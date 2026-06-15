<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Itinerary extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'days',
        'budget_type',
        'total_destinations',
        'estimated_budget',
        'itinerary_data',
    ];

    protected $casts = [
        'days' => 'integer',
        'total_destinations' => 'integer',
        'itinerary_data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}