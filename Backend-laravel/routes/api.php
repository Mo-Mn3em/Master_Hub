<?php

use Illuminate\Http\Request;
use App\Models\CASES;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CasesController;

    Route::get('/user', function (Request $request) {
        return $request->user();
    })->middleware('auth:sanctum');

    //route automatically generates standard CRUD endpoints (index, store, show, update, destroy) for the cases table.
    Route::apiResource('case', CasesController::class);



