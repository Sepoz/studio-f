<?php

use App\Models\Annotation;
use App\Models\Document;

function highlightPayload(int $page = 3): array
{
    return [
        'type' => 'highlight',
        'page' => $page,
        'payload' => [
            'page' => $page,
            'color' => 'yellow',
            'text' => 'important passage',
            'rects' => [
                ['x' => 0.1, 'y' => 0.2, 'w' => 0.3, 'h' => 0.02],
            ],
        ],
    ];
}

it('creates a highlight and returns it in the data envelope', function () {
    $document = Document::factory()->create();

    $this->postJson(route('api.v1.documents.annotations.store', $document), highlightPayload())
        ->assertCreated()
        ->assertJsonPath('data.type', 'highlight')
        ->assertJsonPath('data.page', 3)
        ->assertJsonPath('data.payload.text', 'important passage');

    $this->assertDatabaseHas('annotations', [
        'document_id' => $document->id,
        'type' => 'highlight',
        'page' => 3,
    ]);
});

it('creates a drawing annotation', function () {
    $document = Document::factory()->create();

    $this->postJson(route('api.v1.documents.annotations.store', $document), [
        'type' => 'drawing',
        'page' => 1,
        'payload' => [
            'page' => 1,
            'color' => '#e11d48',
            'size' => 0.004,
            'points' => [[0.1, 0.2, 0.5], [0.15, 0.25]],
        ],
    ])->assertCreated()->assertJsonPath('data.type', 'drawing');
});

it('rejects an invalid highlight with a 422 envelope', function () {
    $document = Document::factory()->create();

    $this->postJson(route('api.v1.documents.annotations.store', $document), [
        'type' => 'highlight',
        'page' => 1,
        'payload' => ['page' => 1],
    ])
        ->assertStatus(422)
        ->assertJsonStructure(['data', 'errors' => [['message', 'code']]])
        ->assertJsonPath('errors.0.code', 'VALIDATION_ERROR');
});

it('creates an empty note (blank body survives ConvertEmptyStringsToNull)', function () {
    $document = Document::factory()->create();

    $this->postJson(route('api.v1.documents.annotations.store', $document), [
        'type' => 'note',
        'page' => 1,
        'payload' => ['page' => 1, 'body' => '', 'anchor' => null],
    ])
        ->assertCreated()
        ->assertJsonPath('data.type', 'note');

    $this->assertDatabaseHas('annotations', [
        'document_id' => $document->id,
        'type' => 'note',
        'page' => 1,
    ]);
});

it('updates a note payload', function () {
    $document = Document::factory()->create();
    $note = Annotation::factory()->note()->for($document)->create();

    $this->patchJson(route('api.v1.documents.annotations.update', [$document, $note]), [
        'page' => $note->page,
        'payload' => ['page' => $note->page, 'body' => 'revised note', 'anchor' => null],
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.payload.body', 'revised note');

    expect($note->fresh()->payload['body'])->toBe('revised note');
});

it('deletes an annotation', function () {
    $document = Document::factory()->create();
    $annotation = Annotation::factory()->for($document)->create();

    $this->deleteJson(route('api.v1.documents.annotations.destroy', [$document, $annotation]))
        ->assertSuccessful()
        ->assertExactJson(['data' => null]);

    $this->assertModelMissing($annotation);
});

it('scopes annotations to their document and 404s across documents', function () {
    $documentA = Document::factory()->create();
    $documentB = Document::factory()->create();
    $annotation = Annotation::factory()->for($documentA)->create();

    $this->patchJson(route('api.v1.documents.annotations.update', [$documentB, $annotation]), [
        'page' => 1,
        'payload' => ['page' => 1, 'body' => 'x', 'anchor' => null],
    ])
        ->assertNotFound()
        ->assertJsonPath('errors.0.code', 'NOT_FOUND');
});
