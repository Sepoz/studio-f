import { Sparkles, Trash2 } from 'lucide-react';

import type { HighlightAnnotation, HighlightColor } from '@/types/study';

const FILL: Record<HighlightColor, string> = {
    yellow: 'rgba(253, 224, 71, 0.45)',
    green: 'rgba(134, 239, 172, 0.45)',
    blue: 'rgba(147, 197, 253, 0.45)',
    pink: 'rgba(249, 168, 212, 0.45)',
};

interface HighlightLayerProps {
    highlights: HighlightAnnotation[];
    onDelete: (id: number) => void;
    onExplain: (text: string, page: number) => void;
}

/**
 * Renders stored highlights as absolutely-positioned overlays. Rects are
 * normalized to the page (0..1), so they scale with the current zoom because
 * the parent stage matches the rendered page size.
 */
export function HighlightLayer({
    highlights,
    onDelete,
    onExplain,
}: HighlightLayerProps) {
    return (
        <div className="pointer-events-none absolute inset-0">
            {highlights.map((highlight) => {
                const anchor = highlight.payload.rects[0];

                return (
                    <div key={highlight.id} className="group">
                        {highlight.payload.rects.map((rect, index) => (
                            <span
                                key={index}
                                className="pointer-events-auto absolute cursor-pointer rounded-[1px]"
                                style={{
                                    left: `${rect.x * 100}%`,
                                    top: `${rect.y * 100}%`,
                                    width: `${rect.w * 100}%`,
                                    height: `${rect.h * 100}%`,
                                    backgroundColor:
                                        FILL[highlight.payload.color],
                                    mixBlendMode: 'multiply',
                                }}
                            />
                        ))}
                        {anchor && (
                            <div
                                className="pointer-events-auto absolute z-10 flex -translate-y-full gap-1 border-2 border-foreground bg-background p-1 opacity-0 shadow-[3px_3px_0_0_var(--foreground)] transition group-hover:opacity-100"
                                style={{
                                    left: `${anchor.x * 100}%`,
                                    top: `${anchor.y * 100}%`,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        onExplain(
                                            highlight.payload.text,
                                            highlight.page,
                                        )
                                    }
                                    aria-label="Explain highlight"
                                    className="rounded p-0.5 hover:bg-accent"
                                >
                                    <Sparkles className="size-3.5 text-primary" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(highlight.id)}
                                    aria-label="Delete highlight"
                                    className="rounded p-0.5 hover:bg-accent"
                                >
                                    <Trash2 className="size-3.5 text-destructive" />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
