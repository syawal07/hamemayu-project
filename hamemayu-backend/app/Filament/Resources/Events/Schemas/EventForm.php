<?php

namespace App\Filament\Resources\Events\Schemas;

use Filament\Schemas\Schema;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\TimePicker;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Repeater;
use Illuminate\Support\Str;

class EventForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Informasi Utama')
                ->schema([
                    TextInput::make('title')
                        ->required()
                        ->maxLength(255)
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn (string $state, callable $set) => $set('slug', Str::slug($state))),
                    TextInput::make('slug')->required()->unique(ignoreRecord: true),
                    RichEditor::make('description')->columnSpanFull(),
                    FileUpload::make('image')->image()->directory('events')->maxSize(2048),
                    Repeater::make('gallery')
                        ->schema([FileUpload::make('url')->image()->directory('events/gallery')])
                        ->columns(3),
                ])->columns(2),

            Section::make('Waktu & Kategori')
                ->schema([
                    Select::make('category')
                        ->options([
                            'culture' => '🎭 Budaya & Tradisi',
                            'concert' => '🎵 Konser & Musik',
                            'sports' => '⚽ Olahraga',
                            'exhibition' => '🖼️ Pameran & Workshop',
                            'festival' => '🎉 Festival',
                            'social' => '🤝 Sosial & Komunitas',
                        ])->required(),
                    DatePicker::make('start_date')->required(),
                    DatePicker::make('end_date'),
                    TimePicker::make('start_time')->seconds(false),
                    TimePicker::make('end_time')->seconds(false),
                ])->columns(2),

            Section::make('Lokasi & Peta')
                ->schema([
                    TextInput::make('location_name'),
                    Textarea::make('location_address'),
                    TextInput::make('location_lat')->numeric()->step(0.00000001),
                    TextInput::make('location_lng')->numeric()->step(0.00000001),
                ])->columns(2),

                Section::make('Tiket & Kuota')
                ->schema([
                    TextInput::make('ticket_price')
                        ->numeric()
                        ->prefix('Rp')
                        ->default(0),
                    TextInput::make('ticket_link')
                        ->url(),
                    TextInput::make('quota')
                        ->numeric()
                        ->nullable(),
                    
                    // ✅ Toggle untuk unknown
                    Toggle::make('is_registered_count_unknown')
                        ->label('Jumlah peserta belum diketahui')
                        ->default(false)
                        ->live(), // ✅ Penting: biar form react langsung
                    
                    // ✅ Field registered count (hidden jika toggle ON)
                    TextInput::make('registered_count')
                        ->numeric()
                        ->nullable()
                        ->default(null)
                        ->hidden(fn (callable $get) => $get('is_registered_count_unknown') === true),
                ])->columns(2),
            
            Section::make('Kontak & Workflow')
                ->schema([
                    TextInput::make('organizer_name'),
                    TextInput::make('organizer_contact'),
                    Toggle::make('is_active')->label('Publish Event')->default(false),
                    
                    // ✅ Fix: readOnly biar value-nya muncul tapi gak bisa diedit manual
                    DateTimePicker::make('published_at')
                        ->readOnly()
                        ->helperText('Terisi otomatis saat event dipublish.'),
                ])->columns(2),
        ]);
    }
}