<?php

use Illuminate\Http\Request;
use App\Models\CASES;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CasesController;

    Route::get('/user', function (Request $request) {
        return $request->user();
    })->middleware('auth:sanctum');

    //route automatically generates standard CRUD endpoints 
    // (index, 
    // store, 
    // show, 
    // update, 
    // destroy) 
    // for the cases table.
// Custom case endpoints (must come before apiResource so 'filter' isn't parsed as a {case} ID)
Route::get('case/filter', [CasesController::class, 'filter']);
Route::post('case/bulkStore', [CasesController::class, 'bulkStore']);

// Standard CRUD routes (index, store, show, update, destroy)
Route::apiResource('case', CasesController::class);
