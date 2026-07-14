<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function redirectToGoogle()
    {
        /** @var \Laravel\Socialite\Two\GoogleProvider $driver */
        $driver = Socialite::driver('google');
        
        $url = $driver->with(['prompt' => 'select_account'])->stateless()->redirect()->getTargetUrl();
        
        return response()->json(['url' => $url]);
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            /** @var \Laravel\Socialite\Two\GoogleProvider $driver */
            $driver = Socialite::driver('google');
            
            /** @var \Laravel\Socialite\Two\User $googleUser */
            $googleUser = $driver->stateless()->user();

            $avatarUrl = !empty($googleUser->avatar) 
                ? $googleUser->avatar 
                : 'https://ui-avatars.com/api/?name=' . urlencode($googleUser->name) . '&background=0D8ABC&color=fff';

            $user = User::updateOrCreate(
                ['google_id' => $googleUser->id],
                [
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'avatar' => $avatarUrl,
                    'password' => Hash::make(uniqid()),
                ]
            );

            $token = $user->createToken('hamemayu-user-token')->plainTextToken;

            //$frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
	    $frontendUrl = env('FRONTEND_URL', request()->getScheme() . '://' . request()->getHttpHost());
            return redirect()->away($frontendUrl . '/auth/callback?token=' . $token);

        } catch (\Exception $e) {
            //$frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            $frontendUrl = env('FRONTEND_URL', request()->getScheme() . '://' . request()->getHttpHost());
            return redirect()->away($frontendUrl . '/login?error=google_auth_failed');
        }
    }

    public function logout(Request $request)
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken $token */
        $token = $request->user()->currentAccessToken();
        $token->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Berhasil logout'
        ]);
    }
}
