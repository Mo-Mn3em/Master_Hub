<?php

use Illuminate\Http\Request;
use App\Models\CASES;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CasesController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NileVerificationController;

// ── Auth Routes (public) ──────────────────────────────────────────────────────
Route::post('login',  [AuthController::class, 'login']);
Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// ── Nile Patient Verification Route ──────────────────────────────────────────
Route::post('nile/verify-patient', [NileVerificationController::class, 'verify']);

// ── Protected user info ───────────────────────────────────────────────────────
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Custom case endpoints (must come before apiResource so 'filter' isn't parsed as a {case} ID)
Route::get('case/filter', [CasesController::class, 'filter']);
Route::post('case/bulkStore', [CasesController::class, 'bulkStore']);

// Standard CRUD routes (index, store, show, update, destroy)
Route::apiResource('case', CasesController::class);

