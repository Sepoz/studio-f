<?php

namespace Database\Factories;

use App\Models\AiGeneration;
use App\Models\Document;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AiGeneration>
 */
class AiGenerationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'document_id' => Document::factory(),
            'kind' => fake()->randomElement(['summary', 'explanation']),
            'page' => null,
            'prompt_input' => fake()->paragraph(),
            'result' => fake()->paragraph(),
            'status' => 'done',
            'model' => 'test-model',
        ];
    }
}
