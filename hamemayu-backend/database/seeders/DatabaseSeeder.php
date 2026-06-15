<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Content;
use App\Models\SiteSetting;
use App\Models\Feature;
use App\Models\Faq;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Sejarah', 'order' => 1],
            ['name' => 'Budaya', 'order' => 2],
            ['name' => 'Kuliner', 'order' => 3],
            ['name' => 'Destinasi', 'order' => 4],
            ['name' => 'Teknologi', 'order' => 5],
            ['name' => 'Peta', 'order' => 6],
        ];

        foreach ($categories as $cat) {
            Category::query()->firstOrCreate(
                ['slug' => Str::slug($cat['name'])],
                [
                    'name' => $cat['name'],
                    'type' => 'pilar',
                    'order' => $cat['order'],
                ]
            );
        }

        $sejarahCat = Category::query()->where('slug', 'sejarah')->first();
        $kulinerCat = Category::query()->where('slug', 'kuliner')->first();
        $destinasiCat = Category::query()->where('slug', 'destinasi')->first();

        Content::query()->firstOrCreate(
            ['slug' => 'keraton-yogyakarta'],
            [
                'category_id' => $sejarahCat->id,
                'title' => 'Keraton Yogyakarta',
                'excerpt' => 'Istana resmi Kesultanan Ngayogyakarta Hadiningrat yang penuh dengan nilai filosofis.',
                'content' => '<p>Keraton Yogyakarta bukan sekadar tempat tinggal raja, melainkan pusat kebudayaan dan sumbu filosofis kota Yogyakarta.</p>',
                'lat' => -7.8052845,
                'lng' => 110.3642031,
                'info' => [
                    'Jam Buka' => '08:00 - 14:00 WIB',
                    'Harga Tiket' => 'Rp 15.000',
                ],
                'is_featured' => true,
                'status' => 'published',
            ]
        );

        Content::query()->firstOrCreate(
            ['slug' => 'gudeg-yu-djum'],
            [
                'category_id' => $kulinerCat->id,
                'title' => 'Gudeg Yu Djum',
                'excerpt' => 'Kuliner legendaris khas Yogyakarta yang terbuat dari nangka muda.',
                'content' => '<p>Gudeg Yu Djum adalah salah satu ikon kuliner Yogyakarta yang menawarkan cita rasa manis dan gurih otentik resep turun-temurun.</p>',
                'lat' => -7.759247,
                'lng' => 110.383794,
                'info' => [
                    'Jam Buka' => '06:00 - 22:00 WIB',
                    'Menu Andalan' => 'Nasi Gudeg Krecek Telur',
                ],
                'is_featured' => true,
                'status' => 'published',
            ]
        );

        Content::query()->firstOrCreate(
            ['slug' => 'pantai-parangtritis'],
            [
                'category_id' => $destinasiCat->id,
                'title' => 'Pantai Parangtritis',
                'excerpt' => 'Pantai eksotis dengan hamparan pasir hitam dan legenda Ratu Selatan.',
                'content' => '<p>Terletak di Kabupaten Bantul, pesona pesisir selatan ini sangat memukau terutama saat matahari terbenam.</p>',
                'lat' => -8.025529,
                'lng' => 110.325988,
                'info' => [
                    'Fasilitas' => 'ATV, Delman, Area Parkir',
                    'Harga Tiket' => 'Rp 10.000',
                ],
                'is_featured' => false,
                'status' => 'published',
            ]
        );

        SiteSetting::query()->firstOrCreate(
            ['id' => 1],
            [
                'site_name' => 'Hamemayu',
                'hero_title' => 'Jelajahi Jiwa Yogyakarta',
                'hero_subtitle' => 'Padukan kecanggihan AI, peta interaktif, dan visualisasi memukau untuk mendalami warisan leluhur. Dari keraton hingga pesisir, semua dalam genggaman.',
                'footer_text' => 'Melestarikan dan mengenalkan kekayaan budaya Nusantara, berawal dari sumbu filosofis Yogyakarta, melalui teknologi modern.',
                'social_links' => [
                    ['platform' => 'FB', 'url' => '#'],
                    ['platform' => 'IG', 'url' => '#'],
                    ['platform' => 'TW', 'url' => '#'],
                    ['platform' => 'YT', 'url' => '#']
                ]
            ]
        );

        Faq::query()->firstOrCreate(
            ['question' => 'Apa itu HamemayuJogja?'],
            [
                'answer' => 'HamemayuJogja adalah platform interaktif Nusantara Digital City yang menggabungkan peta budaya digital, visualisasi 360, dan kecerdasan buatan (AI).',
                'order' => 1,
            ]
        );

        Feature::query()->firstOrCreate(
            ['title' => 'Peta Digital Interaktif'],
            [
                'description' => 'Jelajahi kekayaan sumbu filosofis Yogyakarta dan sekitarnya lewat peta interaktif yang akurat dan mudah digunakan.',
                'order' => 1,
            ]
        );
    }
}