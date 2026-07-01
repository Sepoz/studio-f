<?php

namespace App\Jobs;

use App\Models\Document;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;
use Throwable;

class CountDocumentPages implements ShouldQueue
{
    use Queueable;

    /**
     * @var int
     */
    public $tries = 3;

    /**
     * @var array<int, int>
     */
    public $backoff = [1, 5, 10];

    public function __construct(public Document $document) {}

    public function handle(Parser $parser): void
    {
        // smalot/pdfparser is memory-hungry on large PDFs; give this isolated
        // job headroom beyond the default 128M.
        ini_set('memory_limit', '512M');

        $absolutePath = Storage::disk('local')->path($this->document->path);

        $pdf = $parser->parseFile($absolutePath);

        $this->document->update([
            'page_count' => count($pdf->getPages()),
            'status' => 'ready',
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        $this->document->update(['status' => 'failed']);
    }
}
