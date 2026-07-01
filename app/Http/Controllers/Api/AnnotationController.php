<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnnotationRequest;
use App\Http\Requests\UpdateAnnotationRequest;
use App\Http\Resources\AnnotationResource;
use App\Models\Annotation;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class AnnotationController extends Controller
{
    public function store(StoreAnnotationRequest $request, Document $document): JsonResponse
    {
        $annotation = $document->annotations()->create($request->validated());

        return $this->envelope(new AnnotationResource($annotation), Response::HTTP_CREATED);
    }

    public function update(UpdateAnnotationRequest $request, Document $document, Annotation $annotation): JsonResponse
    {
        $annotation->update($request->validated());

        return $this->envelope(new AnnotationResource($annotation));
    }

    public function destroy(Document $document, Annotation $annotation): JsonResponse
    {
        $annotation->delete();

        return response()->json(['data' => null]);
    }

    private function envelope(AnnotationResource $data, int $status = Response::HTTP_OK): JsonResponse
    {
        return response()->json(['data' => $data], $status);
    }
}
