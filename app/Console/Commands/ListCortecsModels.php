<?php

namespace App\Console\Commands;

use App\Services\Cortecs\CortecsClient;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

#[Signature('cortecs:models')]
#[Description('List the models available on your Cortecs account')]
class ListCortecsModels extends Command
{
    public function handle(CortecsClient $client): int
    {
        try {
            $models = $client->models();
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        if ($models === []) {
            $this->warn('No models returned.');

            return self::SUCCESS;
        }

        $this->table(
            ['ID', 'Context', 'Tools'],
            collect($models)->map(fn (array $model): array => [
                $model['id'] ?? $model['name'] ?? '—',
                $model['context_size'] ?? $model['context'] ?? '—',
                ($model['tools'] ?? false) ? 'yes' : 'no',
            ])->all(),
        );

        $this->info('Set CORTECS_MODEL in your .env to one of the IDs above.');

        return self::SUCCESS;
    }
}
