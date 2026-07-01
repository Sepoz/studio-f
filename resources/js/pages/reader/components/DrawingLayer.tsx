import getStroke from 'perfect-freehand';
import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import { cn } from '@/lib/utils';
import type {
    DrawingAnnotation,
    DrawingPayload,
    StrokePoint,
} from '@/types/study';

interface DrawingLayerProps {
    active: boolean;
    color: string;
    /** Stroke width normalized to page width. */
    size: number;
    pageWidth: number;
    pageHeight: number;
    drawings: DrawingAnnotation[];
    onAddDrawing: (payload: Omit<DrawingPayload, 'page'>) => void;
}

const STROKE_OPTIONS = {
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
} as const;

function toSvgPath(outline: number[][]): string {
    if (outline.length === 0) {
        return '';
    }

    const d = outline.reduce<(string | number)[]>(
        (acc, [x0, y0], index, arr) => {
            const [x1, y1] = arr[(index + 1) % arr.length];
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);

            return acc;
        },
        ['M', ...outline[0], 'Q'],
    );

    d.push('Z');

    return d.join(' ');
}

/** Builds an SVG path from normalized points scaled to the rendered page size. */
function pathFor(
    points: StrokePoint[],
    size: number,
    pageWidth: number,
    pageHeight: number,
): string {
    const pixels = points.map(([x, y, pressure]) => [
        x * pageWidth,
        y * pageHeight,
        pressure ?? 0.5,
    ]);

    return toSvgPath(
        getStroke(pixels, { ...STROKE_OPTIONS, size: size * pageWidth }),
    );
}

export function DrawingLayer({
    active,
    color,
    size,
    pageWidth,
    pageHeight,
    drawings,
    onAddDrawing,
}: DrawingLayerProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [current, setCurrent] = useState<StrokePoint[] | null>(null);

    const normalize = (event: ReactPointerEvent): StrokePoint => {
        const rect = svgRef.current!.getBoundingClientRect();

        return [
            (event.clientX - rect.left) / rect.width,
            (event.clientY - rect.top) / rect.height,
            event.pressure || 0.5,
        ];
    };

    const onPointerDown = (event: ReactPointerEvent) => {
        if (!active) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        setCurrent([normalize(event)]);
    };

    const onPointerMove = (event: ReactPointerEvent) => {
        if (!active || !current) {
            return;
        }

        setCurrent((points) =>
            points ? [...points, normalize(event)] : points,
        );
    };

    const finishStroke = () => {
        if (current && current.length > 1) {
            onAddDrawing({ color, size, points: current });
        }

        setCurrent(null);
    };

    return (
        <svg
            ref={svgRef}
            width={pageWidth}
            height={pageHeight}
            className={cn(
                'absolute inset-0',
                active ? 'z-20 cursor-crosshair' : 'pointer-events-none z-0',
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishStroke}
            onPointerLeave={finishStroke}
        >
            {drawings.map((drawing) => (
                <path
                    key={drawing.id}
                    d={pathFor(
                        drawing.payload.points,
                        drawing.payload.size,
                        pageWidth,
                        pageHeight,
                    )}
                    fill={drawing.payload.color}
                />
            ))}
            {current && current.length > 1 && (
                <path
                    d={pathFor(current, size, pageWidth, pageHeight)}
                    fill={color}
                />
            )}
        </svg>
    );
}
