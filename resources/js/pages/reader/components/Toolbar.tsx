import {
    Highlighter,
    Minus,
    Pencil,
    Plus,
    Sparkles,
    StickyNote,
    Undo2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { HighlightColor } from '@/types/study';

export type ReaderMode = 'select' | 'draw';

const HIGHLIGHT_COLORS: { value: HighlightColor; className: string }[] = [
    { value: 'yellow', className: 'bg-yellow-300' },
    { value: 'green', className: 'bg-green-300' },
    { value: 'blue', className: 'bg-blue-300' },
    { value: 'pink', className: 'bg-pink-300' },
];

export const PEN_COLORS = ['#e11d48', '#111827', '#2563eb', '#16a34a'];

interface ToolbarProps {
    mode: ReaderMode;
    onModeChange: (mode: ReaderMode) => void;
    color: HighlightColor;
    onColorChange: (color: HighlightColor) => void;
    penColor: string;
    onPenColorChange: (color: string) => void;
    onUndo: () => void;
    canUndo: boolean;
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    notesOpen: boolean;
    onToggleNotes: () => void;
    aiOpen: boolean;
    onToggleAi: () => void;
}

export function Toolbar({
    mode,
    onModeChange,
    color,
    onColorChange,
    penColor,
    onPenColorChange,
    onUndo,
    canUndo,
    zoom,
    onZoomIn,
    onZoomOut,
    notesOpen,
    onToggleNotes,
    aiOpen,
    onToggleAi,
}: ToolbarProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border-2 border-foreground p-0.5">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="sm"
                            variant={mode === 'select' ? 'default' : 'ghost'}
                            onClick={() => onModeChange('select')}
                        >
                            <Highlighter className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Select &amp; highlight text</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="sm"
                            variant={mode === 'draw' ? 'default' : 'ghost'}
                            onClick={() => onModeChange('draw')}
                        >
                            <Pencil className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Freehand draw</TooltipContent>
                </Tooltip>
            </div>

            {mode === 'select' ? (
                <div className="flex items-center gap-1">
                    {HIGHLIGHT_COLORS.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => onColorChange(c.value)}
                            aria-label={`${c.value} highlight`}
                            className={cn(
                                'size-5 border-2 border-foreground transition',
                                c.className,
                                color === c.value
                                    ? 'shadow-[2px_2px_0_0_var(--foreground)]'
                                    : 'hover:-translate-y-0.5',
                            )}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-1">
                    {PEN_COLORS.map((hex) => (
                        <button
                            key={hex}
                            type="button"
                            onClick={() => onPenColorChange(hex)}
                            aria-label={`pen ${hex}`}
                            style={{ backgroundColor: hex }}
                            className={cn(
                                'size-5 border-2 border-foreground transition',
                                penColor === hex
                                    ? 'shadow-[2px_2px_0_0_var(--foreground)]'
                                    : 'hover:-translate-y-0.5',
                            )}
                        />
                    ))}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={onUndo}
                                disabled={!canUndo}
                                aria-label="Undo last stroke"
                            >
                                <Undo2 className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo last stroke</TooltipContent>
                    </Tooltip>
                </div>
            )}

            <Separator orientation="vertical" className="h-6 self-center!" />

            <div className="flex items-center gap-1">
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onZoomOut}
                    aria-label="Zoom out"
                >
                    <Minus className="size-4" />
                </Button>
                <span className="w-12 text-center text-sm text-muted-foreground tabular-nums">
                    {Math.round(zoom * 100)}%
                </span>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onZoomIn}
                    aria-label="Zoom in"
                >
                    <Plus className="size-4" />
                </Button>
            </div>

            <Separator orientation="vertical" className="h-6 self-center!" />

            <Button
                size="sm"
                variant={notesOpen ? 'default' : 'ghost'}
                onClick={onToggleNotes}
            >
                <StickyNote className="size-4" />
                Notes
            </Button>

            <Button
                size="sm"
                variant={aiOpen ? 'default' : 'ghost'}
                onClick={onToggleAi}
            >
                <Sparkles className="size-4" />
                AI
            </Button>
        </div>
    );
}
