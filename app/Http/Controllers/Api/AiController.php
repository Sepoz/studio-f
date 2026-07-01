<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ExplainRequest;
use App\Http\Requests\Api\SummarizeRequest;
use App\Models\AiGeneration;
use App\Models\Document;
use App\Services\Cortecs\CortecsClient;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class AiController extends Controller
{
    public function summarize(
        SummarizeRequest $request,
        Document $document,
        CortecsClient $client,
    ): StreamedResponse {
        $page = $request->integer('page') ?: null;
        $source = $request->string('text')->trim()->value();

        $generation = AiGeneration::create([
            'document_id' => $document->id,
            'kind' => 'summary',
            'page' => $page,
            'prompt_input' => $source,
            'status' => 'processing',
            'model' => $client->model(),
        ]);

        if ($source === '') {
            return $this->emptyDocumentResponse($generation);
        }

        $scope = $page ? "page {$page} of" : 'the document';
        $messages = [
            [
                'role' => 'system',
                'content' => 'You are a concise study assistant. Summarize academic material into clear bullet points followed by the key takeaways. Use Markdown.',
            ],
            [
                'role' => 'user',
                'content' => "Summarize {$scope} \"{$document->title}\":\n\n{$source}",
            ],
        ];

        return $this->stream($client, $messages, $generation);
    }

    public function explain(
        ExplainRequest $request,
        Document $document,
        CortecsClient $client,
    ): StreamedResponse {
        $selected = $request->string('text')->trim()->value();
        $page = $request->integer('page') ?: null;

        $generation = AiGeneration::create([
            'document_id' => $document->id,
            'kind' => 'explanation',
            'page' => $page,
            'prompt_input' => $selected,
            'status' => 'processing',
            'model' => $client->model(),
        ]);

        $messages = [
            [
                'role' => 'system',
                'content' => 'You are a patient tutor. Explain the given passage clearly and simply, defining any jargon. Use Markdown.',
            ],
            [
                'role' => 'user',
                'content' => "Explain this passage from \"{$document->title}\":\n\n{$selected}",
            ],
        ];

        return $this->stream($client, $messages, $generation);
    }

    /**
     * Stream the model response to the client while accumulating it for storage.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    private function stream(CortecsClient $client, array $messages, AiGeneration $generation): StreamedResponse
    {
        return response()->stream(function () use ($client, $messages, $generation): void {
            $full = '';

            try {
                foreach ($client->streamChat($messages) as $delta) {
                    $full .= $delta;
                    $this->emit($delta);
                }

                $generation->update(['result' => $full, 'status' => 'done']);
            } catch (Throwable) {
                $generation->update(['status' => 'failed']);
                $this->emit("\n\n_Sorry, the AI request failed. Check your Cortecs configuration._");
            }
        }, 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function emptyDocumentResponse(AiGeneration $generation): StreamedResponse
    {
        $message = 'No selectable text was found in this document. It may be a scanned PDF that needs OCR before it can be summarized.';
        $generation->update(['result' => $message, 'status' => 'done']);

        return response()->stream(function () use ($message): void {
            $this->emit($message);
        }, 200, ['Content-Type' => 'text/plain; charset=utf-8', 'X-Accel-Buffering' => 'no']);
    }

    private function emit(string $text): void
    {
        echo $text;

        if (ob_get_level() > 0) {
            ob_flush();
        }

        flush();
    }
}
