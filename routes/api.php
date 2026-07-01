<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AnnotationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::scopeBindings()->group(function (): void {
        Route::post('documents/{document}/annotations', [AnnotationController::class, 'store'])
            ->name('documents.annotations.store');
        Route::patch('documents/{document}/annotations/{annotation}', [AnnotationController::class, 'update'])
            ->name('documents.annotations.update');
        Route::delete('documents/{document}/annotations/{annotation}', [AnnotationController::class, 'destroy'])
            ->name('documents.annotations.destroy');
    });

    Route::post('documents/{document}/ai/summary', [AiController::class, 'summarize'])
        ->name('documents.ai.summary');
    Route::post('documents/{document}/ai/explain', [AiController::class, 'explain'])
        ->name('documents.ai.explain');
});
