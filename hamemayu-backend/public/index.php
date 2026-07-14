<?php

//use Illuminate\Foundation\Application;
//use Illuminate\Http\Request;

//define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
//if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
//    require $maintenance;
//}

// Register the Composer autoloader...
//require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
//$app = require_once __DIR__.'/../bootstrap/app.php';

//$app->handleRequest(Request::capture());
////////////////////
// === SERVE STATIC FILES DIRECTLY (Before Laravel Boots) ===
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$publicPath = __DIR__ . $requestUri;

// Allowed extensions for static assets
$staticExts = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.ico', '.webp', '.avif', '.json'];
$ext = strtolower(strrchr($requestUri, '.'));

// If request is for a static file that exists, serve it directly
if ($ext && in_array($ext, $staticExts) && file_exists($publicPath) && is_file($publicPath)) {
    // Simple MIME mapping
    $mimes = [
        '.js' => 'application/javascript', '.css' => 'text/css',
        '.png' => 'image/png', '.jpg' => 'image/jpeg', '.jpeg' => 'image/jpeg',
        '.gif' => 'image/gif', '.svg' => 'image/svg+xml',
        '.woff' => 'font/woff', '.woff2' => 'font/woff2',
        '.ttf' => 'font/ttf', '.eot' => 'application/vnd.ms-fontobject',
        '.ico' => 'image/x-icon', '.webp' => 'image/webp', '.avif' => 'image/avif',
        '.json' => 'application/json',
    ];
    
    header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
    header('Cache-Control: public, immutable, max-age=31536000');
    readfile($publicPath);
    exit; // Stop here, don't boot Laravel
}
// === END STATIC FILE HANDLER ===

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
