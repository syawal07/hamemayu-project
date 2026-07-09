<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Wishlist extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'content_id',
        'plannable_type',  // ✅ TAMBAHKAN INI
        'plannable_id',    // ✅ TAMBAHKAN INI
        'notes',
        'visited',
        'priority',
    ];

    protected $casts = [
        'visited' => 'boolean',
        'priority' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function content(): BelongsTo
    {
        return $this->belongsTo(Content::class);
    }

    // ✅ POLYMORPHIC RELATIONSHIP (Event atau Content)
    public function plannable(): MorphTo
    {
        return $this->morphTo();
    }
}