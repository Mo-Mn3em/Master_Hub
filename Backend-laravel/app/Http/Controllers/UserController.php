<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Middleware check helper: ensure authenticated user is admin.
     */
    protected function ensureAdmin(Request $request): ?JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only administrators can perform this action.'
            ], 403);
        }
        return null;
    }

    /**
     * List all users.
     */
    public function index(Request $request): JsonResponse
    {
        if ($unauthorized = $this->ensureAdmin($request)) {
            return $unauthorized;
        }

        $users = User::select(['id', 'name', 'email', 'role', 'department_code', 'created_at', 'updated_at'])
                     ->orderBy('name')
                     ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $users,
        ]);
    }

    /**
     * Create a new user.
     */
    public function store(Request $request): JsonResponse
    {
        if ($unauthorized = $this->ensureAdmin($request)) {
            return $unauthorized;
        }

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|string|max:255|unique:users,email',
            'password'        => 'required|string|min:4',
            'role'            => ['required', Rule::in(['admin', 'user'])],
            'department_code' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name'            => trim($validated['name']),
            'email'           => trim($validated['email']),
            'password'        => Hash::make($validated['password']),
            'role'            => $validated['role'],
            'department_code' => $validated['role'] === 'admin' ? null : ($validated['department_code'] ?? null),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'User created successfully.',
            'data'    => $user,
        ], 201);
    }

    /**
     * Show user details.
     */
    public function show(Request $request, User $user): JsonResponse
    {
        if ($unauthorized = $this->ensureAdmin($request)) {
            return $unauthorized;
        }

        return response()->json([
            'status' => 'success',
            'data'   => $user,
        ]);
    }

    /**
     * Update an existing user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        if ($unauthorized = $this->ensureAdmin($request)) {
            return $unauthorized;
        }

        $validated = $request->validate([
            'name'            => 'sometimes|required|string|max:255',
            'email'           => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password'        => 'nullable|string|min:4',
            'role'            => ['sometimes', 'required', Rule::in(['admin', 'user'])],
            'department_code' => 'nullable|string|max:20',
        ]);

        if (isset($validated['name'])) {
            $user->name = trim($validated['name']);
        }
        if (isset($validated['email'])) {
            $user->email = trim($validated['email']);
        }
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        if (isset($validated['role'])) {
            $user->role = $validated['role'];
            $user->department_code = $validated['role'] === 'admin' ? null : ($validated['department_code'] ?? null);
        } elseif (array_key_exists('department_code', $validated)) {
            $user->department_code = $validated['department_code'];
        }

        $user->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'User updated successfully.',
            'data'    => $user,
        ]);
    }

    /**
     * Delete a user.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($unauthorized = $this->ensureAdmin($request)) {
            return $unauthorized;
        }

        // Prevent self-deletion
        if ($request->user()->id === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own active administrator account.'
            ], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'User deleted successfully.'
        ]);
    }
}
