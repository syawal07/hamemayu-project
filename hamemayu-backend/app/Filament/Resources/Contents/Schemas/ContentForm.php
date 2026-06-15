<?php

namespace App\Filament\Resources\Contents\Schemas;

use Filament\Schemas\Schema;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Grid;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Toggle;
use Illuminate\Support\Str;

class ContentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Informasi Dasar')
                    ->schema([
                        TextInput::make('title')
                            ->required()
                            ->maxLength(255)
                            ->live(onBlur: true)
                            ->afterStateUpdated(fn (callable $set, ?string $state) => $set('slug', Str::slug($state ?? ''))),
                        TextInput::make('slug')
                            ->required()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true),
                        Select::make('category_id')
                            ->relationship('category', 'name')
                            ->required(),
                        Textarea::make('excerpt')
                            ->columnSpanFull(),
                    ])->columns(2),

                Section::make('Detail Konten')
                    ->schema([
                        RichEditor::make('content')
                            ->columnSpanFull(),
                    ]),

                Section::make('Lokasi & Info Tambahan')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                TextInput::make('lat')->numeric(),
                                TextInput::make('lng')->numeric(),
                            ]),
                        KeyValue::make('info')
                            ->keyLabel('Atribut')
                            ->valueLabel('Nilai')
                            ->columnSpanFull(),
                    ]),

                Section::make('Status & Media')
                    ->schema([
                        FileUpload::make('cover_image')
                            ->image()
                            ->directory('contents')
                            ->columnSpanFull(),
                        Select::make('status')
                            ->options([
                                'draft' => 'Draft',
                                'published' => 'Published',
                            ])
                            ->default('draft')
                            ->required(),
                        Toggle::make('is_featured')
                            ->default(false),
                    ])->columns(2),
            ]);
    }
}