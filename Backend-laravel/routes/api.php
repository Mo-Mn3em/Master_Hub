<?php

use Illuminate\Http\Request;
use App\Models\Cases;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CasesController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\NileVerificationController;

// ── Auth Routes (public) ──────────────────────────────────────────────────────
Route::post('login',  [AuthController::class, 'login']);
Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// ── Password Management (authenticated) ───────────────────────────────────────
Route::post('user/change-password', [AuthController::class, 'changePassword'])->middleware('auth:sanctum');

// ── Admin User Management ─────────────────────────────────────────────────────
Route::apiResource('users', UserController::class)->middleware('auth:sanctum');

// ── Nile Patient Personal Summary / Verification / Visits Routes ───────────
Route::post('nile/personal-summary',     [NileVerificationController::class, 'personalSummary']);
Route::post('nile/patient-visits',       [NileVerificationController::class, 'patientVisits']);
Route::post('nile/sync-patient-visits',  [NileVerificationController::class, 'syncPatientVisits']);
Route::post('nile/verify-patient',       [NileVerificationController::class, 'verify']);

// ── Protected user info ───────────────────────────────────────────────────────
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Custom case endpoints (must come before apiResource so 'filter' isn't parsed as a {case} ID)
Route::get('case/filter', [CasesController::class, 'filter']);
Route::post('case/bulkStore', [CasesController::class, 'bulkStore']);

// Standard CRUD routes (index, store, show, update, destroy)
Route::apiResource('case', CasesController::class);


