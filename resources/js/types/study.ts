export type AnnotationType = 'highlight' | 'note' | 'drawing';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface DocumentSummary {
    id: number;
    title: string;
    original_filename: string;
    mime_type: string;
    size_bytes: number;
    page_count: number | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface NormalizedRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface HighlightPayload {
    page: number;
    color: HighlightColor;
    text: string;
    rects: NormalizedRect[];
}

export interface NotePayload {
    page: number;
    /** May be null: Laravel's ConvertEmptyStringsToNull nulls an empty body. */
    body: string | null;
    anchor?: { x: number; y: number } | null;
    highlightId?: number | null;
}

/** `[x, y, pressure?]`, all normalized to page size. */
export type StrokePoint = [number, number, number?];

export interface DrawingPayload {
    page: number;
    color: string;
    /** Stroke width normalized to page width so thickness scales with zoom. */
    size: number;
    points: StrokePoint[];
}

export type AnnotationPayload = HighlightPayload | NotePayload | DrawingPayload;

export interface Annotation<T extends AnnotationPayload = AnnotationPayload> {
    id: number;
    document_id: number;
    type: AnnotationType;
    page: number;
    payload: T;
    created_at: string;
    updated_at: string;
}

export type HighlightAnnotation = Annotation<HighlightPayload> & {
    type: 'highlight';
};
export type NoteAnnotation = Annotation<NotePayload> & { type: 'note' };
export type DrawingAnnotation = Annotation<DrawingPayload> & {
    type: 'drawing';
};
