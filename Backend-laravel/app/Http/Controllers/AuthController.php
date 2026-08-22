<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Login using name + password from the users table.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $loginInput = trim($request->username);

        // Find user by name or email
        $user = User::where('name', $loginInput)
                    ->orWhere('email', $loginInput)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid username or password.',
            ], 401);
        }

        // Revoke old tokens for this user (single-session)
        $user->tokens()->delete();

        // Calculate next 5:00 AM expiration
        $now = \Carbon\Carbon::now();
        $expiresAt = $now->copy()->setTime(5, 0, 0);
        if ($now->greaterThanOrEqualTo($expiresAt)) {
            $expiresAt->addDay();
        }

        // Issue a new Sanctum token expiring at 5:00 AM
        $token = $user->createToken('master_hub_token', ['*'], $expiresAt)->plainTextToken;

        return response()->json([
            'user' => [
                'id'   => $user->id,
                'name' => $user->name,
            ],
            'token'      => $token,
            'expires_at' => $expiresAt->toIso8601String(),
        ]);
    }

    /**
     * Logout — revoke the current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
