<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CasesController;

    Route::get('/', function () {
        return view('welcome');
    });

