<?php

namespace App\Http\Requests;

use App\Models\Annotation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAnnotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The annotation type is immutable; only `page` and `payload` may change.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Annotation $annotation */
        $annotation = $this->route('annotation');

        return [
            'page' => ['required', 'integer', 'min:1', 'max:65535'],
            'payload' => ['required', 'array'],
            ...StoreAnnotationRequest::payloadRules($annotation->type->value),
        ];
    }
}
