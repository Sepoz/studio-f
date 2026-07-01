import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
    createAnnotation,
    deleteAnnotation,
    updateAnnotation,
} from '@/pages/reader/lib/api';
import type {
    Annotation,
    DrawingAnnotation,
    DrawingPayload,
    HighlightAnnotation,
    HighlightPayload,
    NoteAnnotation,
    NotePayload,
} from '@/types/study';

function groupByPage<T extends Annotation>(items: T[]): Map<number, T[]> {
    const map = new Map<number, T[]>();

    for (const item of items) {
        const bucket = map.get(item.page);

        if (bucket) {
            bucket.push(item);
        } else {
            map.set(item.page, [item]);
        }
    }

    return map;
}

export function useAnnotations(documentId: number, initial: Annotation[]) {
    const [annotations, setAnnotations] = useState<Annotation[]>(initial);
    const tempId = useRef(-1);

    const replace = useCallback((id: number, next: Annotation) => {
        setAnnotations((current) =>
            current.map((a) => (a.id === id ? next : a)),
        );
    }, []);

    const drop = useCallback((id: number) => {
        setAnnotations((current) => current.filter((a) => a.id !== id));
    }, []);

    const create = useCallback(
        (optimistic: Annotation) => {
            setAnnotations((current) => [...current, optimistic]);

            createAnnotation(documentId, {
                type: optimistic.type,
                page: optimistic.page,
                payload: optimistic.payload,
            })
                .then((saved) => replace(optimistic.id, saved))
                .catch(() => {
                    drop(optimistic.id);
                    toast.error('Could not save annotation.');
                });
        },
        [documentId, replace, drop],
    );

    const buildOptimistic = useCallback(
        <T extends Annotation>(
            type: T['type'],
            page: number,
            payload: T['payload'],
        ): T => {
            const now = new Date().toISOString();

            return {
                id: tempId.current--,
                document_id: documentId,
                type,
                page,
                payload,
                created_at: now,
                updated_at: now,
            } as T;
        },
        [documentId],
    );

    const addHighlight = useCallback(
        (page: number, payload: HighlightPayload) => {
            create(
                buildOptimistic<HighlightAnnotation>(
                    'highlight',
                    page,
                    payload,
                ),
            );
        },
        [create, buildOptimistic],
    );

    const addNote = useCallback(
        (page: number, payload: NotePayload) => {
            create(buildOptimistic<NoteAnnotation>('note', page, payload));
        },
        [create, buildOptimistic],
    );

    const addDrawing = useCallback(
        (page: number, payload: DrawingPayload) => {
            create(
                buildOptimistic<DrawingAnnotation>('drawing', page, payload),
            );
        },
        [create, buildOptimistic],
    );

    const updateNote = useCallback(
        (id: number, payload: NotePayload) => {
            let previous: Annotation | undefined;
            setAnnotations((current) =>
                current.map((a) => {
                    if (a.id === id) {
                        previous = a;

                        return { ...a, payload };
                    }

                    return a;
                }),
            );

            // Only persist annotations that already exist server-side.
            if (id < 0) {
                return;
            }

            updateAnnotation(documentId, id, {
                page: previous?.page ?? payload.page,
                payload,
            })
                .then((saved) => replace(id, saved))
                .catch(() => {
                    if (previous) {
                        replace(id, previous);
                    }

                    toast.error('Could not update note.');
                });
        },
        [documentId, replace],
    );

    const remove = useCallback(
        (id: number) => {
            let previous: Annotation | undefined;
            setAnnotations((current) => {
                previous = current.find((a) => a.id === id);

                return current.filter((a) => a.id !== id);
            });

            if (id < 0) {
                return;
            }

            deleteAnnotation(documentId, id).catch(() => {
                if (previous) {
                    setAnnotations((current) => [
                        ...current,
                        previous as Annotation,
                    ]);
                }

                toast.error('Could not delete annotation.');
            });
        },
        [documentId],
    );

    const highlightsByPage = useMemo(
        () =>
            groupByPage(
                annotations.filter(
                    (a): a is HighlightAnnotation => a.type === 'highlight',
                ),
            ),
        [annotations],
    );

    const drawingsByPage = useMemo(
        () =>
            groupByPage(
                annotations.filter(
                    (a): a is DrawingAnnotation => a.type === 'drawing',
                ),
            ),
        [annotations],
    );

    const notes = useMemo(
        () =>
            annotations
                .filter((a): a is NoteAnnotation => a.type === 'note')
                .sort((a, b) => a.page - b.page),
        [annotations],
    );

    return {
        annotations,
        highlightsByPage,
        drawingsByPage,
        notes,
        addHighlight,
        addNote,
        addDrawing,
        updateNote,
        remove,
    };
}
