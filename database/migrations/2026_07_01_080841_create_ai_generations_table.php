<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ai_generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->string('kind');
            $table->unsignedSmallInteger('page')->nullable();
            $table->longText('prompt_input')->nullable();
            $table->longText('result')->nullable();
            $table->string('status')->default('pending');
            $table->string('model')->nullable();
            $table->timestamps();

            $table->index(['document_id', 'kind']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_generations');
    }
};
