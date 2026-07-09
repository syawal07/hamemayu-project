<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wishlists', function (Blueprint $table) {
            // Jadikan content_id nullable
            $table->unsignedBigInteger('content_id')->nullable()->change();
            
            // Pastikan kolom polymorphic ada (kalau belum)
            if (!Schema::hasColumn('wishlists', 'plannable_type')) {
                $table->string('plannable_type')->nullable()->after('content_id');
            }
            if (!Schema::hasColumn('wishlists', 'plannable_id')) {
                $table->unsignedBigInteger('plannable_id')->nullable()->after('plannable_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('wishlists', function (Blueprint $table) {
            $table->unsignedBigInteger('content_id')->nullable(false)->change();
        });
    }
};