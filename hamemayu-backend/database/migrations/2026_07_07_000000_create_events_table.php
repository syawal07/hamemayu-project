<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            
            // Informasi Utama
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('description')->nullable();
            $table->string('image')->nullable();
            $table->json('gallery')->nullable();
            
            // Waktu & Kategori
            $table->string('category');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            
            // Lokasi & Peta
            $table->string('location_name')->nullable();
            $table->text('location_address')->nullable();
            $table->decimal('location_lat', 10, 8)->nullable();
            $table->decimal('location_lng', 11, 8)->nullable();
            
            // Tiket & Kuota
            $table->integer('ticket_price')->default(0);
            $table->string('ticket_link')->nullable();
            $table->integer('quota')->nullable();
            $table->unsignedInteger('registered_count')->default(0); // Wajib ada untuk diubah oleh file Apridan
            
            // Kontak & Workflow
            $table->string('organizer_name')->nullable();
            $table->string('organizer_contact')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamp('published_at')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};