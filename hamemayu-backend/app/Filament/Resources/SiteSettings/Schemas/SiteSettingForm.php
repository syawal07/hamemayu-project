<?php

namespace App\Filament\Resources\SiteSettings\Schemas;

use Filament\Schemas\Schema;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;

class SiteSettingForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Identitas Web')
                    ->schema([
                        TextInput::make('site_name')->required(),
                        FileUpload::make('site_logo')->image()->directory('settings'),
                    ])->columns(2),

                Section::make('Hero Section (Halaman Depan)')
                    ->schema([
                        TextInput::make('hero_title'),
                        Textarea::make('hero_subtitle')->columnSpanFull(),
                        FileUpload::make('hero_background')->image()->directory('settings')->columnSpanFull(),
                    ]),

                Section::make('Footer & Sosial Media')
                    ->schema([
                        Textarea::make('footer_text')->columnSpanFull(),
                        Repeater::make('social_links')
                            ->schema([
                                Select::make('platform')->options([
                                    'FB' => 'Facebook',
                                    'IG' => 'Instagram',
                                    'TW' => 'Twitter / X',
                                    'YT' => 'YouTube',
                                ])->required(),
                                TextInput::make('url')->url()->required(),
                            ])->columns(2)->columnSpanFull(),
                    ])
            ]);
    }
}