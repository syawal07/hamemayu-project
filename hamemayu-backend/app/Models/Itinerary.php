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
        'start_date',
        'end_date',
        'days',
        'budget_type',
        'total_destinations',
        'estimated_budget',
        'itinerary_data',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'days' => 'integer',
        'itinerary_data' => 'array',
    ];

    public function getDaysAttribute($value)
    {
        if ($this->start_date && $this->end_date) {
            return $this->start_date->diffInDays($this->end_date) + 1;
        }
        return $value ?? 0;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}