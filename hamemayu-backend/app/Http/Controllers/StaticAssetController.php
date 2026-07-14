<?php

namespace App\Http\Controllers;

class StaticAssetController extends Controller
{
public function serve($path)
{
    $allowed = ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'woff', 'woff2', 'ttf', 'eot', 'ico', 'webp', 'avif'];
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    
    if (!in_array($ext, $allowed)) {
        \Log::error("StaticAsset: Extension not allowed: $ext");
        abort(404);
    }
    
    $file = public_path($path);
    
    \Log::info("StaticAsset: path=$path, file=$file, exists=" . (file_exists($file) ? 'YES' : 'NO'));
    
    if (!file_exists($file) || !is_file($file)) {
        abort(404);
    }
    
    $mimes = [
        'js' => 'application/javascript', 'css' => 'text/css',
        'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
        'gif' => 'image/gif', 'svg' => 'image/svg+xml',
        'woff' => 'font/woff', 'woff2' => 'font/woff2',
        'ttf' => 'font/ttf', 'eot' => 'application/vnd.ms-fontobject',
        'ico' => 'image/x-icon', 'webp' => 'image/webp', 'avif' => 'image/avif',
    ];
    
    $response = response()->file($file, [
        'Content-Type' => $mimes[$ext] ?? 'application/octet-stream',
        'Cache-Control' => 'public, immutable, max-age=31536000',
    ]);
    
    \Log::info("StaticAsset: Serving with Content-Type=" . ($mimes[$ext] ?? 'application/octet-stream'));
    
    return $response;
}
}
