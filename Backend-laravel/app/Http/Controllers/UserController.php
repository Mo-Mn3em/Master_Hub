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
     * Helper to normalize department codes input to JSON string or null.
     */
    protected function normalizeDepartmentCodes($role, $input): ?string
    {
        if ($role === 'admin') {
            return null;
        }

        if (empty($input)) {
            return null;
        }

        if (is_array($input)) {
            $filtered = array_values(array_filter(array_map('trim', $input)));
            return empty($filtered) ? null : json_encode($filtered);
        }

        if (is_string($input)) {
            $trimmed = trim($input);
            if (empty($trimmed)) {
                return null;
            }
            if (str_starts_with($trimmed, '[') && str_ends_with($trimmed, ']')) {
                return $trimmed;
            }
            if (str_contains($trimmed, ',')) {
                $parts = array_values(array_filter(array_map('trim', explode(',', $trimmed))));
                return json_encode($parts);
            }
            return json_encode([$trimmed]);
        }

        return null;
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
            'name'             => 'required|string|max:255',
            'email'            => 'required|string|max:255|unique:users,email',
            'password'         => 'required|string|min:4',
            'role'             => ['required', Rule::in(['admin', 'user'])],
            'department_codes' => 'nullable',
            'department_code'  => 'nullable',
        ]);

        $deptInput = $request->input('department_codes', $request->input('department_code'));
        $normalizedDept = $this->normalizeDepartmentCodes($validated['role'], $deptInput);

        $user = User::create([
            'name'            => trim($validated['name']),
            'email'           => trim($validated['email']),
            'password'        => Hash::make($validated['password']),
            'role'            => $validated['role'],
            'department_code' => $normalizedDept,
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
            'name'             => 'sometimes|required|string|max:255',
            'email'            => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password'         => 'nullable|string|min:4',
            'role'             => ['sometimes', 'required', Rule::in(['admin', 'user'])],
            'department_codes' => 'nullable',
            'department_code'  => 'nullable',
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

        $newRole = $validated['role'] ?? $user->role;
        $user->role = $newRole;

        if ($newRole === 'admin') {
            $user->department_code = null;
        } elseif ($request->has('department_codes') || $request->has('department_code')) {
            $deptInput = $request->input('department_codes', $request->input('department_code'));
            $user->department_code = $this->normalizeDepartmentCodes($newRole, $deptInput);
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
