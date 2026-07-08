<?php

namespace App\Filament\Resources\Events\Tables;

use App\Models\Event;
use Filament\Tables\Table;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;

// ✅ NAMESPACE YANG BENAR UNTUK FILAMENT v5.6.1
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\Action;
use Filament\Support\Icons\Heroicon;

class EventsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('image')->circular(),
                TextColumn::make('title')->searchable()->sortable(),
                BadgeColumn::make('category')
                    ->colors([
                        'culture' => 'warning',
                        'concert' => 'success', 
                        'sports' => 'info', 
                        'festival' => 'danger'
                    ]),
                TextColumn::make('start_date')->date('d M Y')->sortable(),
                TextColumn::make('ticket_price')->money('IDR')->sortable(),
                IconColumn::make('is_active')->boolean(),
            ])
            ->filters([
                SelectFilter::make('category')->options([
                    'culture' => 'Budaya', 
                    'concert' => 'Konser', 
                    'sports' => 'Olahraga',
                    'exhibition' => 'Pameran', 
                    'festival' => 'Festival', 
                    'social' => 'Sosial'
                ]),
                TernaryFilter::make('is_active')->label('Status Publish'),
            ])
            ->actions([
                EditAction::make(),
                DeleteAction::make(),
                
                // KOMEN DULU ACTION PREVIEW KARENA ROUTE BELUM ADA
                // Action::make('preview')
                //     ->url(fn (Event $record) => route('events.show', $record->slug))
                //     ->openUrlInNewTab()
                //     ->icon(Heroicon::OutlinedEye),
            ]);
    }
}