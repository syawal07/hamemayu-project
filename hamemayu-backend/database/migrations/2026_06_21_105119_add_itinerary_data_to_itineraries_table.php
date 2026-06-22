<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('itineraries', function (Blueprint $table) {
            // Tambah kolom JSON untuk menyimpan data itinerary lengkap
            // nullable() biar itinerary lama yang belum punya data ini nggak error
            $table->json('itinerary_data')->nullable()->after('estimated_budget');
        });
    }

    public function down()
    {
        Schema::table('itineraries', function (Blueprint $table) {
            $table->dropColumn('itinerary_data');
        });
    }
};