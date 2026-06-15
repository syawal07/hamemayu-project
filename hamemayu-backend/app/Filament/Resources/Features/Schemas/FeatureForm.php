<?php

namespace App\Filament\Resources\Features\Schemas;

use Filament\Schemas\Schema;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Toggle;

class FeatureForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Detail Fitur')
                    ->schema([
                        TextInput::make('title')->required()->label('Judul Fitur'),
                        TextInput::make('order')->numeric()->default(0)->label('Urutan Tampil'),
                        Textarea::make('description')->required()->columnSpanFull()->label('Deskripsi'),
                        FileUpload::make('image')->image()->directory('features')->columnSpanFull()->label('Gambar/Ilustrasi'),
                        Toggle::make('is_active')->default(true)->label('Aktifkan Fitur Ini?'),
                    ])->columns(2)
            ]);
    }
}