import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useDebouncedCallback } from '@/pages/reader/hooks/useAutosave';
import type { NoteAnnotation, NotePayload } from '@/types/study';

interface NotesSidebarProps {
    notes: NoteAnnotation[];
    currentPage: number;
    onAdd: (page: number, payload: NotePayload) => void;
    onUpdate: (id: number, payload: NotePayload) => void;
    onDelete: (id: number) => void;
    onJumpToPage: (page: number) => void;
}

function NoteCard({
    note,
    onUpdate,
    onDelete,
    onJumpToPage,
}: {
    note: NoteAnnotation;
    onUpdate: (id: number, payload: NotePayload) => void;
    onDelete: (id: number) => void;
    onJumpToPage: (page: number) => void;
}) {
    const [body, setBody] = useState(note.payload.body ?? '');
    const persist = useDebouncedCallback(
        (value: string) => onUpdate(note.id, { ...note.payload, body: value }),
        700,
    );

    return (
        <div className="rounded-lg border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => onJumpToPage(note.page)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                    Page {note.page}
                </button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    onClick={() => onDelete(note.id)}
                    aria-label="Delete note"
                >
                    <Trash2 className="size-3.5 text-destructive" />
                </Button>
            </div>
            <Textarea
                value={body}
                placeholder="Write a note…"
                className="min-h-20 resize-y text-sm"
                onChange={(event) => {
                    setBody(event.target.value);
                    persist(event.target.value);
                }}
            />
        </div>
    );
}

export function NotesSidebar({
    notes,
    currentPage,
    onAdd,
    onUpdate,
    onDelete,
    onJumpToPage,
}: NotesSidebarProps) {
    return (
        <aside className="flex w-80 shrink-0 flex-col border-l-[3px] border-foreground bg-background">
            <div className="flex items-center justify-between border-b-[3px] border-foreground px-4 py-3">
                <h2 className="font-heading text-sm font-bold tracking-tight uppercase">
                    Notes
                </h2>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                        onAdd(currentPage, {
                            page: currentPage,
                            body: '',
                            anchor: null,
                        })
                    }
                >
                    <Plus className="size-4" />
                    Page {currentPage}
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-3 p-4">
                    {notes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No notes yet. Add one for the page you are reading.
                        </p>
                    ) : (
                        notes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                onJumpToPage={onJumpToPage}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
