import { useVirtualizer } from '@tanstack/react-virtual';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { Document, Page } from 'react-pdf';

import { Skeleton } from '@/components/ui/skeleton';
import '@/lib/pdf';
import { cn } from '@/lib/utils';
import { DrawingLayer } from '@/pages/reader/components/DrawingLayer';
import { HighlightLayer } from '@/pages/reader/components/HighlightLayer';
import type { ReaderMode } from '@/pages/reader/components/Toolbar';
import { captureSelection } from '@/pages/reader/lib/selection';
import type {
    DrawingAnnotation,
    DrawingPayload,
    HighlightAnnotation,
    HighlightColor,
    HighlightPayload,
    NormalizedRect,
} from '@/types/study';

const PAGE_GAP = 16;
const MIN_PAGE_WIDTH = 320;
const MAX_PAGE_WIDTH = 900;
const DEFAULT_ASPECT = 1.414;

interface PdfViewerProps {
    fileUrl: string;
    zoom: number;
    mode: ReaderMode;
    color: HighlightColor;
    penColor: string;
    penSize: number;
    highlightsByPage: Map<number, HighlightAnnotation[]>;
    drawingsByPage: Map<number, DrawingAnnotation[]>;
    onAddHighlight: (page: number, payload: HighlightPayload) => void;
    onDeleteHighlight: (id: number) => void;
    onExplainHighlight: (text: string, page: number) => void;
    onAddDrawing: (page: number, payload: DrawingPayload) => void;
    onPdfLoad: (pdf: PDFDocumentProxy) => void;
    onNumPages: (numPages: number) => void;
    onVisiblePageChange: (page: number) => void;
    scrollToPageRef: React.RefObject<((page: number) => void) | null>;
    /** localStorage key used to remember/restore the current page. */
    persistKey: string;
}

export function PdfViewer({
    fileUrl,
    zoom,
    mode,
    color,
    penColor,
    penSize,
    highlightsByPage,
    drawingsByPage,
    onAddHighlight,
    onDeleteHighlight,
    onExplainHighlight,
    onAddDrawing,
    onPdfLoad,
    onNumPages,
    onVisiblePageChange,
    scrollToPageRef,
    persistKey,
}: PdfViewerProps) {
    'use no memo';

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [numPages, setNumPages] = useState(0);
    const [aspect, setAspect] = useState(DEFAULT_ASPECT);
    const restoredRef = useRef(false);

    const pageWidth = Math.round(
        Math.min(
            Math.max(containerWidth - 48, MIN_PAGE_WIDTH),
            MAX_PAGE_WIDTH,
        ) * zoom,
    );
    const pageHeight = Math.round(pageWidth * aspect);

    useLayoutEffect(() => {
        const element = containerRef.current;

        if (!element) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width);
        });
        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const virtualizer = useVirtualizer({
        count: numPages,
        getScrollElement: () => containerRef.current,
        estimateSize: () => pageWidth * aspect + PAGE_GAP,
        overscan: 2,
        measureElement: (element) => element.getBoundingClientRect().height,
        onChange: (instance) => {
            const page = (instance.range?.startIndex ?? 0) + 1;
            onVisiblePageChange(page);

            // Only persist once the initial page has been restored, so the
            // pre-restore "page 1" never clobbers the saved position.
            if (restoredRef.current && typeof window !== 'undefined') {
                window.localStorage.setItem(persistKey, String(page));
            }
        },
    });

    // Re-flow estimates when the page size changes (zoom, resize, aspect known).
    useEffect(() => {
        virtualizer.measure();
    }, [pageWidth, aspect, virtualizer]);

    // Restore the last-viewed page once the document + layout are ready.
    // Page heights are estimates until measured, so a single scrollToIndex
    // drifts over long documents — re-issue it across a few frames until the
    // target page is actually in view (measurements refine the offset each time).
    useEffect(() => {
        if (restoredRef.current || numPages === 0 || containerWidth === 0) {
            return;
        }

        if (typeof window === 'undefined') {
            restoredRef.current = true;

            return;
        }

        const saved = Number(window.localStorage.getItem(persistKey));

        if (!(Number.isFinite(saved) && saved > 1 && saved <= numPages)) {
            restoredRef.current = true;

            return;
        }

        let raf = 0;
        let tries = 0;
        let cancelled = false;

        const attempt = () => {
            if (cancelled) {
                return;
            }

            virtualizer.scrollToIndex(saved - 1, { align: 'start' });
            tries += 1;
            const current = (virtualizer.range?.startIndex ?? -1) + 1;

            if (tries < 12 && current !== saved) {
                raf = requestAnimationFrame(attempt);
            } else {
                restoredRef.current = true;
            }
        };

        raf = requestAnimationFrame(attempt);

        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
        };
    }, [numPages, containerWidth, persistKey, virtualizer]);

    useEffect(() => {
        scrollToPageRef.current = (page: number) => {
            virtualizer.scrollToIndex(page - 1, { align: 'start' });
        };

        return () => {
            scrollToPageRef.current = null;
        };
    }, [virtualizer, scrollToPageRef]);

    const handleMouseUp = useCallback(() => {
        if (mode !== 'select' || !containerRef.current) {
            return;
        }

        const captured = captureSelection(containerRef.current);

        if (!captured) {
            return;
        }

        const payload: HighlightPayload = {
            page: captured.page,
            color,
            text: captured.text,
            rects: captured.rects as NormalizedRect[],
        };
        onAddHighlight(captured.page, payload);
        window.getSelection()?.removeAllRanges();
    }, [mode, color, onAddHighlight]);

    const items = virtualizer.getVirtualItems();

    return (
        <div
            ref={containerRef}
            onMouseUp={handleMouseUp}
            className={cn(
                'h-full overflow-auto bg-muted/40 py-6',
                mode === 'draw' && 'select-none',
            )}
        >
            {containerWidth > 0 && (
                <Document
                    file={fileUrl}
                    onLoadSuccess={(pdf) => {
                        setNumPages(pdf.numPages);
                        onNumPages(pdf.numPages);
                        onPdfLoad(pdf);
                    }}
                    loading={
                        <CenteredSkeleton width={pageWidth} aspect={aspect} />
                    }
                    error={
                        <p className="py-12 text-center text-sm text-destructive">
                            Failed to load this document.
                        </p>
                    }
                    className="flex flex-col items-center"
                >
                    {numPages > 0 && (
                        <div
                            style={{
                                height: virtualizer.getTotalSize(),
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {items.map((item) => {
                                const page = item.index + 1;

                                return (
                                    <div
                                        key={item.key}
                                        data-index={item.index}
                                        ref={virtualizer.measureElement}
                                        className="absolute top-0 left-0 flex w-full justify-center"
                                        style={{
                                            transform: `translateY(${item.start}px)`,
                                            paddingBottom: PAGE_GAP,
                                        }}
                                    >
                                        <div
                                            data-page-number={page}
                                            className="relative bg-white shadow-md"
                                            style={{ width: pageWidth }}
                                        >
                                            <Page
                                                key={`${page}@${pageWidth}`}
                                                pageNumber={page}
                                                width={pageWidth}
                                                renderAnnotationLayer={false}
                                                onLoadSuccess={(loadedPage) => {
                                                    const ratio =
                                                        loadedPage.height /
                                                        loadedPage.width;

                                                    if (
                                                        Number.isFinite(
                                                            ratio,
                                                        ) &&
                                                        ratio > 0
                                                    ) {
                                                        setAspect((current) =>
                                                            Math.abs(
                                                                current - ratio,
                                                            ) > 0.01
                                                                ? ratio
                                                                : current,
                                                        );
                                                    }
                                                }}
                                                loading={
                                                    <Skeleton
                                                        style={{
                                                            width: pageWidth,
                                                            height:
                                                                pageWidth *
                                                                aspect,
                                                        }}
                                                    />
                                                }
                                            />
                                            <HighlightLayer
                                                highlights={
                                                    highlightsByPage.get(
                                                        page,
                                                    ) ?? []
                                                }
                                                onDelete={onDeleteHighlight}
                                                onExplain={onExplainHighlight}
                                            />
                                            <DrawingLayer
                                                active={mode === 'draw'}
                                                color={penColor}
                                                size={penSize}
                                                pageWidth={pageWidth}
                                                pageHeight={pageHeight}
                                                drawings={
                                                    drawingsByPage.get(page) ??
                                                    []
                                                }
                                                onAddDrawing={(payload) =>
                                                    onAddDrawing(page, {
                                                        ...payload,
                                                        page,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Document>
            )}
        </div>
    );
}

function CenteredSkeleton({
    width,
    aspect,
}: {
    width: number;
    aspect: number;
}) {
    return (
        <div className="flex justify-center py-6">
            <Skeleton style={{ width, height: width * aspect }} />
        </div>
    );
}
