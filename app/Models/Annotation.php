<?php

namespace App\Models;

use App\Enums\AnnotationType;
use Database\Factories\AnnotationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $document_id
 * @property AnnotationType $type
 * @property int $page
 * @property array<string, mixed> $payload
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'document_id',
    'type',
    'page',
    'payload',
])]
class Annotation extends Model
{
    /** @use HasFactory<AnnotationFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Document, $this>
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => AnnotationType::class,
            'page' => 'integer',
            'payload' => 'array',
        ];
    }
}
