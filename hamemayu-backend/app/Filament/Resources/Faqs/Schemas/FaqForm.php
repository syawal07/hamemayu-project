<?php

namespace App\Filament\Resources\Faqs\Schemas;

use Filament\Schemas\Schema;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;

class FaqForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Tanya Jawab')
                    ->schema([
                        TextInput::make('question')->required()->columnSpanFull()->label('Pertanyaan'),
                        Textarea::make('answer')->required()->columnSpanFull()->label('Jawaban'),
                        TextInput::make('order')->numeric()->default(0)->label('Urutan Tampil'),
                        Toggle::make('is_active')->default(true)->label('Tampilkan di Web?'),
                    ])->columns(2)
            ]);
    }
}