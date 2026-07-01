<?php

namespace Database\Factories;

use App\Models\Document;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(3);

        return [
            'title' => rtrim($title, '.'),
            'original_filename' => fake()->slug().'.pdf',
            'path' => 'documents/'.fake()->uuid().'.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => fake()->numberBetween(50_000, 5_000_000),
            'page_count' => fake()->numberBetween(1, 300),
            'status' => 'ready',
        ];
    }

    public function processing(): static
    {
        return $this->state(fn (): array => [
            'status' => 'processing',
            'page_count' => null,
        ]);
    }
}
