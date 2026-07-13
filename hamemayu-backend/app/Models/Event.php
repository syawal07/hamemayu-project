<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Builder;

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
        'start_date' => 'date',
        'end_date' => 'date',
        'start_time' => 'string',
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
            if ($event->is_active && is_null($event->published_at)) {
                $event->published_at = now();
            }
        });
    }

    public function setTitleAttribute(string $value)
    {
        $this->attributes['title'] = $value;
        $this->attributes['slug'] = Str::slug($value);
    }

    public function getStatusAttribute()
    {
        if (!$this->start_date) return 'upcoming';

        try {
            $now = now();
            $startTime = !empty($this->start_time) ? $this->start_time : '00:00:00';
            $endTime = !empty($this->end_time) ? $this->end_time : '23:59:59';
            
            $start = \Carbon\Carbon::parse($this->start_date)->setTimeFromTimeString($startTime);
            $endDate = $this->end_date ? $this->end_date : $this->start_date;
            $end = \Carbon\Carbon::parse($endDate)->setTimeFromTimeString($endTime);

            if ($now >= $start && $now <= $end) return 'ongoing';
            if ($now > $end) return 'past';
            return 'upcoming';
        } catch (\Throwable $th) {
            return 'upcoming';
        }
    }

    public function getMapEmbedUrlAttribute()
    {
        if ($this->location_lat && $this->location_lng) {
            return "https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q={$this->location_lat},{$this->location_lng}";
        }
        return null;
    }

    public function getStartDatetimeAttribute()
    {
        if (!$this->start_date) return null;
        try {
            return \Carbon\Carbon::parse($this->start_date)->setTimeFromTimeString(!empty($this->start_time) ? $this->start_time : '00:00:00');
        } catch (\Throwable $th) {
            return \Carbon\Carbon::parse($this->start_date);
        }
    }

    public function getEndDatetimeAttribute()
    {
        if (!$this->start_date && !$this->end_date) return null;
        try {
            $endDate = $this->end_date ? $this->end_date : $this->start_date;
            return \Carbon\Carbon::parse($endDate)->setTimeFromTimeString(!empty($this->end_time) ? $this->end_time : '23:59:59');
        } catch (\Throwable $th) {
            return $this->end_date ? \Carbon\Carbon::parse($this->end_date) : null;
        }
    }

    public function scopePublished(Builder $query)
    {
        return $query->where('is_active', true)->whereNotNull('published_at');
    }

    public function scopeByCategory(Builder $query, string $category)
    {
        return $category === 'all' ? $query : $query->where('category', $category);
    }

    public function scopeByStatus(Builder $query, string $status)
    {
        return $query->having('status', $status);
    }

    public function scopeSearch(Builder $query, string $keyword)
    {
        return $query->where(function (Builder $q) use ($keyword) {
            $q->where('title', 'like', "%{$keyword}%")
              ->orWhere('location_name', 'like', "%{$keyword}%")
              ->orWhere('organizer_name', 'like', "%{$keyword}%");
        });
    }

    public function itineraryItems()
    {
        $related = 'App\Models\ItineraryItem';
        return $this->morphMany($related, 'plannable');
    }
}