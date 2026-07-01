<?php

namespace App\Services\Cortecs;

use Generator;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Thin client for the Cortecs OpenAI-compatible API (https://docs.cortecs.ai).
 */
class CortecsClient
{
    private string $key;

    private string $baseUrl;

    private string $model;

    public function __construct()
    {
        $this->key = (string) config('services.cortecs.key');
        $this->baseUrl = rtrim((string) config('services.cortecs.base_url'), '/');
        $this->model = (string) config('services.cortecs.model');
    }

    public function model(): string
    {
        return $this->model;
    }

    /**
     * Stream a chat completion, yielding content deltas as they arrive.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return Generator<int, string>
     */
    public function streamChat(array $messages): Generator
    {
        $this->ensureConfigured();

        $response = Http::withToken($this->key)
            ->withOptions(['stream' => true])
            ->timeout(120)
            ->connectTimeout(15)
            ->post($this->baseUrl.'/chat/completions', [
                'model' => $this->model,
                'messages' => $messages,
                'stream' => true,
            ])
            ->throw();

        $body = $response->toPsrResponse()->getBody();
        $buffer = '';

        while (! $body->eof()) {
            $buffer .= $body->read(2048);

            while (($newlinePos = strpos($buffer, "\n")) !== false) {
                $line = trim(substr($buffer, 0, $newlinePos));
                $buffer = substr($buffer, $newlinePos + 1);

                if ($line === '' || ! str_starts_with($line, 'data:')) {
                    continue;
                }

                $data = trim(substr($line, 5));

                if ($data === '[DONE]') {
                    return;
                }

                $delta = json_decode($data, true)['choices'][0]['delta']['content'] ?? '';

                if ($delta !== '') {
                    yield $delta;
                }
            }
        }
    }

    /**
     * List the models available for the configured account.
     *
     * @return array<int, array<string, mixed>>
     */
    public function models(): array
    {
        $this->ensureConfigured(requireModel: false);

        return Http::withToken($this->key)
            ->timeout(30)
            ->get($this->baseUrl.'/models')
            ->throw()
            ->json('data', []);
    }

    private function ensureConfigured(bool $requireModel = true): void
    {
        if ($this->key === '') {
            throw new RuntimeException('CORTECS_API_KEY is not set. Add it to your .env file.');
        }

        if ($requireModel && $this->model === '') {
            throw new RuntimeException(
                'CORTECS_MODEL is not set. Run `php artisan cortecs:models` to list available models, then set it in .env.'
            );
        }
    }
}
