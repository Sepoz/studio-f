<?php

use App\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/documents')->name('home');

Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');

// Streams the raw PDF from the private disk with range-request support so pdf.js can seek large files.
Route::get('/documents/{document}/file', [DocumentController::class, 'file'])->name('documents.file');
