<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocumentRequest;
use App\Http\Resources\AnnotationResource;
use App\Jobs\CountDocumentPages;
use App\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentController extends Controller
{
    public function index(): InertiaResponse
    {
        return Inertia::render('documents/index', [
            'documents' => Document::query()
                ->latest()
                ->get([
                    'id', 'title', 'original_filename', 'mime_type',
                    'size_bytes', 'page_count', 'status', 'created_at', 'updated_at',
                ]),
        ]);
    }

    public function store(StoreDocumentRequest $request): RedirectResponse
    {
        $file = $request->file('file');
        $path = $file->store('documents', 'local');

        $document = Document::create([
            'title' => $request->string('title')->trim()->value()
                ?: Str::of($file->getClientOriginalName())->beforeLast('.')->value(),
            'original_filename' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => 'application/pdf',
            'size_bytes' => $file->getSize(),
            'status' => 'processing',
        ]);

        CountDocumentPages::dispatch($document);

        return to_route('documents.index');
    }

    public function show(Document $document): InertiaResponse
    {
        return Inertia::render('reader/reader', [
            'document' => $document->only([
                'id', 'title', 'original_filename', 'mime_type',
                'size_bytes', 'page_count', 'status', 'created_at', 'updated_at',
            ]),
            'annotations' => AnnotationResource::collection(
                $document->annotations()->orderBy('page')->get()
            )->resolve(),
        ]);
    }

    public function destroy(Document $document): RedirectResponse
    {
        Storage::disk('local')->delete($document->path);
        $document->delete();

        return to_route('documents.index');
    }

    public function file(Document $document): BinaryFileResponse|Response
    {
        $disk = Storage::disk('local');

        abort_unless($disk->exists($document->path), 404);

        // BinaryFileResponse natively sets `Accept-Ranges: bytes` and honours
        // Range requests, letting pdf.js stream/seek large documents.
        return response()->file($disk->path($document->path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.addslashes($document->original_filename).'"',
        ]);
    }
}
