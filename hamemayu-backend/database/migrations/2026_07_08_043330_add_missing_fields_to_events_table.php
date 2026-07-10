<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Event;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // ✅ HANYA UBAH registered_count JADI NULLABLE
            $table->unsignedInteger('registered_count')->nullable()->change();
        });

        // ✅ Fix data lama: Set published_at untuk event yang udah aktif
        Event::where('is_active', true)->whereNull('published_at')->update(['published_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->unsignedInteger('registered_count')->nullable(false)->change();
        });
    }
};