<?php

namespace App\Filament\Resources\SiteSettings\Tables;

use Filament\Actions\EditAction;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ImageColumn;

class SiteSettingsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('site_name')->label('Nama Situs'),
                ImageColumn::make('site_logo')->label('Logo'),
                TextColumn::make('hero_title')->label('Judul Hero')->limit(30),
                TextColumn::make('updated_at')->dateTime()->label('Terakhir Diperbarui'),
            ])
            ->filters([
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
            ]);
    }
}