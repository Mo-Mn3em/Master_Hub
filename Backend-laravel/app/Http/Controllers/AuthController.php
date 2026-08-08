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

        // Find user by name field
        $user = User::where('name', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid username or password.',
            ], 401);
        }

        // Revoke old tokens for this user (single-session)
        $user->tokens()->delete();

        // Issue a new Sanctum token
        $token = $user->createToken('master_hub_token')->plainTextToken;

        return response()->json([
            'user' => [
                'id'   => $user->id,
                'name' => $user->name,
            ],
            'token' => $token,
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
