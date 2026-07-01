import {
    destroy as destroyAction,
    store as storeAction,
    update as updateAction,
} from '@/actions/App/Http/Controllers/Api/AnnotationController';
import type {
    Annotation,
    AnnotationPayload,
    AnnotationType,
} from '@/types/study';

interface Envelope<T> {
    data: T;
}

async function requestJson<T>(
    url: string,
    method: string,
    body?: unknown,
): Promise<T> {
    const response = await fetch(url, {
        // Uppercase the verb: the Fetch API does not normalize `PATCH`, so a
        // lowercase method reaches the server verbatim and strict servers
        // (PHP's built-in server, some proxies) reject it as malformed.
        method: method.toUpperCase(),
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
}

export async function createAnnotation(
    documentId: number,
    input: { type: AnnotationType; page: number; payload: AnnotationPayload },
): Promise<Annotation> {
    const { data } = await requestJson<Envelope<Annotation>>(
        storeAction.url(documentId),
        'post',
        input,
    );

    return data;
}

export async function updateAnnotation(
    documentId: number,
    annotationId: number,
    input: { page: number; payload: AnnotationPayload },
): Promise<Annotation> {
    const { data } = await requestJson<Envelope<Annotation>>(
        updateAction.url([documentId, annotationId]),
        'patch',
        input,
    );

    return data;
}

export async function deleteAnnotation(
    documentId: number,
    annotationId: number,
): Promise<void> {
    await requestJson<Envelope<null>>(
        destroyAction.url([documentId, annotationId]),
        'delete',
    );
}
