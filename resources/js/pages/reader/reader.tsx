import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
    lazy,
    Suspense,
    useCallback,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/AppLayout';
import { AiPanel } from '@/pages/reader/components/AiPanel';
import { NotesSidebar } from '@/pages/reader/components/NotesSidebar';
import { PEN_COLORS, Toolbar } from '@/pages/reader/components/Toolbar';
import type { ReaderMode } from '@/pages/reader/components/Toolbar';
import { useAiStream } from '@/pages/reader/hooks/useAiStream';
import { useAnnotations } from '@/pages/reader/hooks/useAnnotations';
import { extractDocText, extractPageText } from '@/pages/reader/lib/pdfText';
import * as documents from '@/routes/documents';
import type {
    Annotation,
    DocumentSummary,
    HighlightColor,
} from '@/types/study';

// pdf.js touches browser globals (DOMMatrix, etc.) at import time, so load the
// viewer client-only to avoid crashing Inertia's server-side render.
const PdfViewer = lazy(() =>
    import('@/pages/reader/components/PdfViewer').then((module) => ({
        default: module.PdfViewer,
    })),
);

interface ReaderProps {
    document: DocumentSummary;
    annotations: Annotation[];
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.2;
const PEN_SIZE = 0.005;

export default function Reader({ document, annotations }: ReaderProps) {
    const [zoom, setZoom] = useState(1);
    const [mode, setMode] = useState<ReaderMode>('select');
    const [color, setColor] = useState<HighlightColor>('yellow');
    const [penColor, setPenColor] = useState<string>(PEN_COLORS[0]);
    const [notesOpen, setNotesOpen] = useState(true);
    const [aiOpen, setAiOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const scrollToPageRef = useRef<((page: number) => void) | null>(null);
    const pdfRef = useRef<PDFDocumentProxy | null>(null);
    // true on the client, false during SSR — gates the client-only PDF viewer.
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );

    const ai = useAiStream(document.id);

    const summarizeDocument = useCallback(async () => {
        if (!pdfRef.current) {
            return;
        }

        ai.summarize(await extractDocText(pdfRef.current), null);
    }, [ai]);

    const summarizePage = useCallback(async () => {
        if (!pdfRef.current) {
            return;
        }

        ai.summarize(
            await extractPageText(pdfRef.current, currentPage),
            currentPage,
        );
    }, [ai, currentPage]);

    const {
        annotations: allAnnotations,
        highlightsByPage,
        drawingsByPage,
        notes,
        addHighlight,
        addNote,
        addDrawing,
        updateNote,
        remove,
    } = useAnnotations(document.id, annotations);

    const lastDrawing = [...allAnnotations]
        .reverse()
        .find((annotation) => annotation.type === 'drawing');

    const jumpToPage = useCallback((page: number) => {
        scrollToPageRef.current?.(page);
    }, []);

    const explainHighlight = useCallback(
        (text: string, page: number) => {
            setAiOpen(true);
            ai.explain(text, page);
        },
        [ai],
    );

    const header = (
        <div className="flex w-full items-center gap-3">
            <Button asChild size="icon" variant="ghost">
                <Link href={documents.index().url} aria-label="Back to library">
                    <ArrowLeft className="size-4" />
                </Link>
            </Button>
            <div className="min-w-0 flex-1">
                <p className="truncate font-heading font-bold tracking-tight uppercase">
                    {document.title}
                </p>
                <p className="font-mono text-xs text-muted-foreground uppercase">
                    Page {currentPage}
                    {numPages > 0 ? ` of ${numPages}` : ''}
                </p>
            </div>
            <Toolbar
                mode={mode}
                onModeChange={setMode}
                color={color}
                onColorChange={setColor}
                penColor={penColor}
                onPenColorChange={setPenColor}
                onUndo={() => lastDrawing && remove(lastDrawing.id)}
                canUndo={lastDrawing !== undefined}
                zoom={zoom}
                onZoomIn={() =>
                    setZoom((z) =>
                        Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)),
                    )
                }
                onZoomOut={() =>
                    setZoom((z) =>
                        Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)),
                    )
                }
                notesOpen={notesOpen}
                onToggleNotes={() => setNotesOpen((open) => !open)}
                aiOpen={aiOpen}
                onToggleAi={() => setAiOpen((open) => !open)}
            />
        </div>
    );

    return (
        <AppLayout header={header} flush>
            <Head title={document.title} />
            <div className="flex h-full min-h-0">
                <div className="min-w-0 flex-1">
                    {mounted ? (
                        <Suspense
                            fallback={<div className="h-full bg-muted/40" />}
                        >
                            <PdfViewer
                                fileUrl={documents.file(document.id).url}
                                zoom={zoom}
                                mode={mode}
                                color={color}
                                penColor={penColor}
                                penSize={PEN_SIZE}
                                highlightsByPage={highlightsByPage}
                                drawingsByPage={drawingsByPage}
                                onAddHighlight={addHighlight}
                                onDeleteHighlight={remove}
                                onExplainHighlight={explainHighlight}
                                onAddDrawing={addDrawing}
                                onPdfLoad={(pdf) => {
                                    pdfRef.current = pdf;
                                }}
                                onNumPages={setNumPages}
                                onVisiblePageChange={setCurrentPage}
                                scrollToPageRef={scrollToPageRef}
                                persistKey={`reader:${document.id}:page`}
                            />
                        </Suspense>
                    ) : (
                        <div className="h-full bg-muted/40" />
                    )}
                </div>
                {notesOpen && (
                    <NotesSidebar
                        notes={notes}
                        currentPage={currentPage}
                        onAdd={addNote}
                        onUpdate={updateNote}
                        onDelete={remove}
                        onJumpToPage={jumpToPage}
                    />
                )}
                {aiOpen && (
                    <AiPanel
                        title={ai.title}
                        text={ai.text}
                        isStreaming={ai.isStreaming}
                        currentPage={currentPage}
                        onSummarizeDocument={summarizeDocument}
                        onSummarizePage={summarizePage}
                    />
                )}
            </div>
        </AppLayout>
    );
}
