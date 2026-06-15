<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('itineraries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->integer('days');
            $table->string('budget_type')->nullable();
            $table->integer('total_destinations')->default(0);
            $table->string('estimated_budget')->nullable();
            $table->json('itinerary_data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('itineraries');
    }
};