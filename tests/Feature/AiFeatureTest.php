<?php

use App\Models\AiGeneration;
use App\Models\Document;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.cortecs.key' => 'test-key',
        'services.cortecs.base_url' => 'https://api.cortecs.ai/v1',
        'services.cortecs.model' => 'test-model',
    ]);
});

function fakeCortecsStream(): void
{
    $sse = "data: {\"choices\":[{\"delta\":{\"content\":\"Hello \"}}]}\n\n"
        ."data: {\"choices\":[{\"delta\":{\"content\":\"world\"}}]}\n\n"
        ."data: [DONE]\n\n";

    Http::fake(['*/chat/completions' => Http::response($sse, 200)]);
}

it('streams a summary and records the generation', function () {
    fakeCortecsStream();

    $document = Document::factory()->create();

    $response = $this->post(route('api.v1.documents.ai.summary', $document), [
        'text' => 'the source text of page one',
        'page' => 1,
    ]);

    $response->assertOk();
    expect($response->streamedContent())->toContain('Hello world');

    Http::assertSent(function ($request) {
        return str_contains($request->url(), '/chat/completions')
            && $request['model'] === 'test-model'
            && $request['stream'] === true
            && $request->hasHeader('Authorization', 'Bearer test-key');
    });

    $generation = AiGeneration::sole();
    expect($generation->kind)->toBe('summary')
        ->and($generation->status)->toBe('done')
        ->and($generation->result)->toBe('Hello world');
});

it('streams an explanation of selected text', function () {
    fakeCortecsStream();
    $document = Document::factory()->create();

    $response = $this->post(route('api.v1.documents.ai.explain', $document), [
        'text' => 'entropy is a measure of disorder',
        'page' => 4,
    ]);

    $response->assertOk();
    expect($response->streamedContent())->toContain('Hello world');

    $generation = AiGeneration::sole();
    expect($generation->kind)->toBe('explanation')
        ->and($generation->page)->toBe(4)
        ->and($generation->prompt_input)->toBe('entropy is a measure of disorder')
        ->and($generation->status)->toBe('done');
});

it('does not call the model when no text is supplied', function () {
    Http::preventStrayRequests();
    Http::fake();

    $document = Document::factory()->create();

    $response = $this->post(route('api.v1.documents.ai.summary', $document), [
        'text' => '',
    ]);

    $response->assertOk();
    expect($response->streamedContent())->toContain('scanned PDF');

    Http::assertNothingSent();
    expect(AiGeneration::sole()->status)->toBe('done');
});

it('validates the explain request requires text', function () {
    $document = Document::factory()->create();

    $this->postJson(route('api.v1.documents.ai.explain', $document), ['text' => ''])
        ->assertStatus(422)
        ->assertJsonPath('errors.0.code', 'VALIDATION_ERROR');
});
