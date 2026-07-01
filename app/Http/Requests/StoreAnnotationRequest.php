<?php

namespace App\Http\Requests;

use App\Enums\AnnotationType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnnotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(AnnotationType::class)],
            'page' => ['required', 'integer', 'min:1', 'max:65535'],
            'payload' => ['required', 'array'],
            ...self::payloadRules($this->input('type')),
        ];
    }

    /**
     * Payload validation rules keyed by annotation type.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public static function payloadRules(?string $type): array
    {
        $common = [
            'payload.page' => ['required', 'integer', 'min:1'],
        ];

        return match ($type) {
            AnnotationType::Highlight->value => [
                ...$common,
                'payload.color' => ['required', Rule::in(['yellow', 'green', 'blue', 'pink'])],
                'payload.text' => ['required', 'string'],
                'payload.rects' => ['required', 'array', 'min:1'],
                'payload.rects.*.x' => ['required', 'numeric'],
                'payload.rects.*.y' => ['required', 'numeric'],
                'payload.rects.*.w' => ['required', 'numeric'],
                'payload.rects.*.h' => ['required', 'numeric'],
            ],
            AnnotationType::Note->value => [
                ...$common,
                'payload.body' => ['present', 'nullable', 'string'],
                'payload.anchor' => ['nullable', 'array'],
                'payload.anchor.x' => ['required_with:payload.anchor', 'numeric'],
                'payload.anchor.y' => ['required_with:payload.anchor', 'numeric'],
                'payload.highlightId' => ['nullable', 'integer'],
            ],
            AnnotationType::Drawing->value => [
                ...$common,
                'payload.color' => ['required', 'string', 'max:32'],
                'payload.size' => ['required', 'numeric', 'min:0'],
                'payload.points' => ['required', 'array', 'min:1'],
                'payload.points.*' => ['array', 'min:2', 'max:3'],
                'payload.points.*.*' => ['numeric'],
            ],
            default => $common,
        };
    }
}
