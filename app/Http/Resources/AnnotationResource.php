<?php

namespace App\Http\Resources;

use App\Models\Annotation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Annotation
 */
class AnnotationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_id' => $this->document_id,
            'type' => $this->type->value,
            'page' => $this->page,
            'payload' => $this->payload,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
