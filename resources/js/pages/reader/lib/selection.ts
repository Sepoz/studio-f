import type { NormalizedRect } from '@/types/study';

export interface CapturedSelection {
    page: number;
    text: string;
    rects: NormalizedRect[];
}

interface Box {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/**
 * `range.getClientRects()` returns one rect per text-layer span fragment, and
 * adjacent fragments on the same line overlap. Rendered with mix-blend-multiply
 * those overlaps compound into a darker "double" band. Merge fragments that sit
 * on the same line into a single box so each line highlights evenly.
 */
function mergeRectsByLine(rects: DOMRect[]): Box[] {
    const sorted = rects
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .sort((a, b) => a.top - b.top || a.left - b.left);

    const lines: Box[] = [];

    for (const rect of sorted) {
        const rectCenter = rect.top + rect.height / 2;
        const line = lines.find((candidate) => {
            const tolerance =
                Math.min(candidate.bottom - candidate.top, rect.height) / 2;
            const lineCenter = (candidate.top + candidate.bottom) / 2;

            return Math.abs(lineCenter - rectCenter) <= tolerance;
        });

        if (line) {
            line.left = Math.min(line.left, rect.left);
            line.top = Math.min(line.top, rect.top);
            line.right = Math.max(line.right, rect.right);
            line.bottom = Math.max(line.bottom, rect.bottom);
        } else {
            lines.push({
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
            });
        }
    }

    return lines;
}

/**
 * Reads the current window selection and, if it falls inside a rendered page,
 * returns its bounding rects normalized to that page (0..1). Returns null when
 * there is no usable selection. Multi-page selections are clamped to the page
 * the selection started on.
 */
export function captureSelection(
    container: HTMLElement,
): CapturedSelection | null {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return null;
    }

    const text = selection.toString().trim();

    if (text === '') {
        return null;
    }

    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;
    const startEl =
        startNode.nodeType === Node.TEXT_NODE
            ? startNode.parentElement
            : (startNode as HTMLElement);
    const stage = startEl?.closest<HTMLElement>('[data-page-number]');

    if (!stage || !container.contains(stage) || !stage.dataset.pageNumber) {
        return null;
    }

    const pageRect = stage.getBoundingClientRect();

    if (pageRect.width === 0 || pageRect.height === 0) {
        return null;
    }

    const rects: NormalizedRect[] = mergeRectsByLine(
        Array.from(range.getClientRects()),
    )
        .map((box) => ({
            x: (box.left - pageRect.left) / pageRect.width,
            y: (box.top - pageRect.top) / pageRect.height,
            w: (box.right - box.left) / pageRect.width,
            h: (box.bottom - box.top) / pageRect.height,
        }))
        .filter((rect) => rect.y >= -0.02 && rect.y <= 1.02);

    if (rects.length === 0) {
        return null;
    }

    return { page: Number(stage.dataset.pageNumber), text, rects };
}
