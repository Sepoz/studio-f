<?php

namespace Database\Factories;

use App\Enums\AnnotationType;
use App\Models\Annotation;
use App\Models\Document;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Annotation>
 */
class AnnotationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $page = fake()->numberBetween(1, 50);

        return [
            'document_id' => Document::factory(),
            'type' => AnnotationType::Highlight,
            'page' => $page,
            'payload' => [
                'page' => $page,
                'color' => fake()->randomElement(['yellow', 'green', 'blue', 'pink']),
                'text' => fake()->sentence(),
                'rects' => [
                    ['x' => 0.12, 'y' => 0.34, 'w' => 0.40, 'h' => 0.021],
                ],
            ],
        ];
    }

    public function note(): static
    {
        return $this->state(function (array $attributes): array {
            $page = $attributes['page'] ?? fake()->numberBetween(1, 50);

            return [
                'type' => AnnotationType::Note,
                'payload' => [
                    'page' => $page,
                    'body' => fake()->paragraph(),
                    'anchor' => ['x' => 0.5, 'y' => 0.2],
                    'highlightId' => null,
                ],
            ];
        });
    }

    public function drawing(): static
    {
        return $this->state(function (array $attributes): array {
            $page = $attributes['page'] ?? fake()->numberBetween(1, 50);

            return [
                'type' => AnnotationType::Drawing,
                'payload' => [
                    'page' => $page,
                    'color' => '#e11d48',
                    'size' => 0.004,
                    'points' => [
                        [0.12, 0.34, 0.5],
                        [0.13, 0.35, 0.7],
                    ],
                ],
            ];
        });
    }
}
