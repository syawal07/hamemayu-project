<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;

class CCTVProxyController extends Controller
{
    public function index()
    {
        $targetUrl = 'https://cctv.jogjakota.go.id/';

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ])->get($targetUrl);

            if ($response->failed()) {
                return response('Failed to load CCTV content', 502);
            }

            $html = $response->body();

            // ✅ SCRIPT SUPER AGGRESSIVE DENGAN MUTATION OBSERVER
            // ✅ SCRIPT DENGAN PREVENT DOUBLE-CLICK
            $script = '
            <script>
                (function() {
                    console.log("[HAMEMAYU] Starting smart auto-clicker...");
                    
                    // Flag global di window object biar semua fungsi bisa akses
                    window.hamemayuClicked = false;
                    
                    function tryClickBeranda() {
                        // Kalau udah pernah klik, langsung stop
                        if (window.hamemayuClicked) {
                            return true;
                        }
                        
                        // CARA 1: Cari link dengan text "Beranda"
                        var links = document.querySelectorAll("a");
                        for (var i = 0; i < links.length; i++) {
                            var link = links[i];
                            if (link.innerText.trim() === "Beranda") {
                                console.log("[HAMEMAYU] ✓ Beranda link found & clicked!");
                                window.hamemayuClicked = true;
                                link.click();
                                return true;
                            }
                        }
                        
                        // CARA 2: Cari button
                        var buttons = document.querySelectorAll("button, .btn");
                        for (var i = 0; i < buttons.length; i++) {
                            var btn = buttons[i];
                            if (btn.innerText.includes("Beranda")) {
                                console.log("[HAMEMAYU] ✓ Beranda button found & clicked!");
                                window.hamemayuClicked = true;
                                btn.click();
                                return true;
                            }
                        }
                        
                        return false;
                    }
                    
                    // STRATEGI 1: Tunggu 3 detik, lalu coba klik
                    var timeoutId = setTimeout(function() {
                        if (tryClickBeranda()) {
                            console.log("[HAMEMAYU] Success on first try!");
                            return;
                        }
                        
                        // STRATEGI 2: Kalau gagal, pakai MutationObserver
                        var observer = new MutationObserver(function(mutations) {
                            if (window.hamemayuClicked) {
                                observer.disconnect();
                                return;
                            }
                            if (tryClickBeranda()) {
                                observer.disconnect();
                                console.log("[HAMEMAYU] Success via MutationObserver!");
                            }
                        });
                        
                        observer.observe(document.body, {
                            childList: true,
                            subtree: true
                        });
                        
                        console.log("[HAMEMAYU] MutationObserver activated...");
                        
                        // STRATEGI 3: Fallback interval (tapi cuma 3x coba)
                        var attemptCount = 0;
                        var intervalId = setInterval(function() {
                            attemptCount++;
                            if (window.hamemayuClicked || attemptCount >= 3) {
                                clearInterval(intervalId);
                                observer.disconnect();
                                console.log("[HAMEMAYU] Auto-clicker stopped. Total attempts: " + attemptCount);
                                return;
                            }
                            tryClickBeranda();
                        }, 1500);
                        
                    }, 3000);
                    
                    // Expose function ke window untuk debugging
                    window.hamemayuForceClick = tryClickBeranda;
                    
                })();
            </script>
            ';

            // Inject script sebelum </head>
            $html = str_replace('</head>', $script . '</head>', $html);

            return response($html, 200)
                ->header('Content-Type', 'text/html; charset=UTF-8')
                ->header('X-Frame-Options', 'ALLOWALL')
                ->header('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");

        } catch (\Exception $e) {
            return response('Error: ' . $e->getMessage(), 500);
        }
    }
}