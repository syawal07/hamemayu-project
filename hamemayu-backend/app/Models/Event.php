<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'slug', 'description', 'image', 'gallery', 'category',
        'start_date', 'end_date', 'start_time', 'end_time',
        'location_name', 'location_address', 'location_lat', 'location_lng',
        'ticket_price', 'ticket_link', 'quota', 'registered_count',
        'organizer_name', 'organizer_contact', 'is_active', 'published_at',
        'is_registered_count_unknown',
    ];

    protected $casts = [
        'start_date' => 'date',      // Harus 'date', bukan 'string'
        'end_date' => 'date',
        'start_time' => 'string',    // Time tetap string (HH:MM:SS)
        'end_time' => 'string',
        'published_at' => 'datetime',
        'is_active' => 'boolean',
        'is_registered_count_unknown' => 'boolean',
        'gallery' => 'array',
        'ticket_price' => 'decimal:2',
    ];

    protected static function boot()
{
    parent::boot();
    
    static::saving(function ($event) {
        // Auto isi published_at saat event pertama kali di-publish
        if ($event->is_active && is_null($event->published_at)) {
            $event->published_at = now();
        }
    });
}

    // Auto generate slug
    public function setTitleAttribute($value)
    {
        $this->attributes['title'] = $value;
        $this->attributes['slug'] = Str::slug($value);
    }

    // STATUS OTOMATIS (Ongoing, Upcoming, Past)
    public function getStatusAttribute()
    {
        $now = now();
        $start = $this->start_date->copy()->setTimeFromTimeString($this->start_time ?? '00:00:00');
        $end = ($this->end_date ? $this->end_date->copy() : $this->start_date->copy())
                ->setTimeFromTimeString($this->end_time ?? '23:59:59');

        if ($now >= $start && $now <= $end) return 'ongoing';
        if ($now > $end) return 'past';
        return 'upcoming';
    }

    // GOOGLE MAPS EMBED URL
    public function getMapEmbedUrlAttribute()
    {
        if ($this->location_lat && $this->location_lng) {
            return "https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q={$this->location_lat},{$this->location_lng}";
        }
        return null;
    }

    // FULL DATETIME HELPERS
    public function getStartDatetimeAttribute()
    {
        return $this->start_date->copy()->setTimeFromTimeString($this->start_time ?? '00:00:00');
    }

    public function getEndDatetimeAttribute()
    {
        $date = $this->end_date ? $this->end_date->copy() : $this->start_date->copy();
        return $date->setTimeFromTimeString($this->end_time ?? '23:59:59');
    }

    // SCOPES FILTER & SORTING
    public function scopePublished($query)
    {
        return $query->where('is_active', true)->whereNotNull('published_at');
    }

    public function scopeByCategory($query, $category)
    {
        return $category === 'all' ? $query : $query->where('category', $category);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->having('status', $status); // Perlu groupBy atau filter di collection jika pakai accessor
    }

    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('title', 'like', "%{$keyword}%")
              ->orWhere('location_name', 'like', "%{$keyword}%")
              ->orWhere('organizer_name', 'like', "%{$keyword}%");
        });
    }

    // RELASI POLYMORPHIC KE ITINERARY
    public function itineraryItems()
    {
        return $this->morphMany(ItineraryItem::class, 'plannable');
    }
}