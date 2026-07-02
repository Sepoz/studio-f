<?php

use App\Models\Annotation;
use App\Models\Document;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('lists documents on the library page', function () {
    Document::factory()->count(3)->create();

    $this->get(route('documents.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('documents/index')
            ->has('documents', 3)
        );
});

it('stores an uploaded pdf', function () {
    Storage::fake('local');

    $file = UploadedFile::fake()->create('lecture-notes.pdf', 200, 'application/pdf');

    $this->post(route('documents.store'), ['file' => $file])
        ->assertRedirect(route('documents.index'));

    $document = Document::sole();

    expect($document->title)->toBe('lecture-notes')
        ->and($document->mime_type)->toBe('application/pdf')
        ->and($document->size_bytes)->toBe($file->getSize());

    Storage::disk('local')->assertExists($document->path);
});

it('rejects non-pdf uploads', function () {
    Storage::fake('local');

    $file = UploadedFile::fake()->create('malware.exe', 10, 'application/octet-stream');

    $this->post(route('documents.store'), ['file' => $file])
        ->assertSessionHasErrors('file');

    expect(Document::count())->toBe(0);
});

it('renders the reader with the document and its annotations', function () {
    $document = Document::factory()->create();
    Annotation::factory()->count(2)->for($document)->create();

    $this->get(route('documents.show', $document))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('reader/reader')
            ->where('document.id', $document->id)
            ->has('annotations', 2)
        );
});

it('streams the pdf file with range support', function () {
    Storage::fake('local');
    $document = Document::factory()->create(['path' => 'documents/sample.pdf']);
    Storage::disk('local')->put('documents/sample.pdf', '%PDF-1.4 fake');

    $response = $this->get(route('documents.file', $document));

    $response->assertSuccessful();
    expect($response->headers->get('Content-Type'))->toContain('application/pdf')
        ->and($response->headers->get('Accept-Ranges'))->toBe('bytes');
});

it('returns 404 when the stored pdf is missing', function () {
    Storage::fake('local');
    $document = Document::factory()->create(['path' => 'documents/missing.pdf']);

    $this->get(route('documents.file', $document))->assertNotFound();
});

it('deletes the document, its file, and cascades annotations', function () {
    Storage::fake('local');
    $document = Document::factory()->create(['path' => 'documents/sample.pdf']);
    Storage::disk('local')->put('documents/sample.pdf', '%PDF-1.4 fake');
    $annotation = Annotation::factory()->for($document)->create();

    $this->delete(route('documents.destroy', $document))
        ->assertRedirect(route('documents.index'));

    Storage::disk('local')->assertMissing('documents/sample.pdf');
    $this->assertModelMissing($document);
    $this->assertModelMissing($annotation);
});
