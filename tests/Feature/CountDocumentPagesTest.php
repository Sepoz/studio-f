<?php

use App\Jobs\CountDocumentPages;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Document as PdfDocument;
use Smalot\PdfParser\Parser;

it('counts pages and marks the document ready', function () {
    Storage::fake('local');
    $document = Document::factory()->processing()->create(['path' => 'documents/x.pdf']);
    Storage::disk('local')->put('documents/x.pdf', '%PDF-1.4 fake');

    $pdf = Mockery::mock(PdfDocument::class);
    $pdf->shouldReceive('getPages')->andReturn([1, 2, 3]);

    $parser = Mockery::mock(Parser::class);
    $parser->shouldReceive('parseFile')->once()->andReturn($pdf);

    (new CountDocumentPages($document))->handle($parser);

    $document->refresh();

    expect($document->page_count)->toBe(3)
        ->and($document->status)->toBe('ready');
});

it('marks the document failed when parsing throws', function () {
    $document = Document::factory()->processing()->create();

    (new CountDocumentPages($document))->failed(new Exception('corrupt pdf'));

    expect($document->fresh()->status)->toBe('failed');
});
