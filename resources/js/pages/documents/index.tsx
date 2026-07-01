import { Head, Link, router, useForm, usePoll } from '@inertiajs/react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { DragEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/AppLayout';
import * as documents from '@/routes/documents';
import type { DocumentSummary } from '@/types/study';

interface DocumentsIndexProps {
    documents: DocumentSummary[];
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }

    return `${value.toFixed(1)} ${units[unit]}`;
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'ready') {
        return <Badge variant="default">Ready</Badge>;
    }

    if (status === 'failed') {
        return <Badge variant="destructive">Failed</Badge>;
    }

    return (
        <Badge variant="secondary" className="gap-1">
            <Loader2 className="size-3 animate-spin" />
            Processing
        </Badge>
    );
}

export default function DocumentsIndex({
    documents: docs,
}: DocumentsIndexProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [toDelete, setToDelete] = useState<DocumentSummary | null>(null);
    const { setData, post, processing, progress, reset } = useForm<{
        file: File | null;
    }>({
        file: null,
    });

    // Keep polling while any document is still being processed.
    usePoll(
        3000,
        { only: ['documents'] },
        { autoStart: docs.some((doc) => doc.status === 'processing') },
    );

    const upload = (file: File) => {
        setData('file', file);
        post(documents.store().url, {
            forceFormData: true,
            onSuccess: () => reset('file'),
        });
    };

    const onDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];

        if (file) {
            upload(file);
        }
    };

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }

        router.delete(documents.destroy(toDelete.id).url, {
            preserveScroll: true,
            onFinish: () => setToDelete(null),
        });
    };

    return (
        <AppLayout
            header={
                <div className="font-heading font-bold tracking-tight uppercase">
                    Library
                </div>
            }
        >
            <Head title="Library" />

            <label
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`mb-8 flex cursor-pointer flex-col items-center justify-center gap-2 border-[3px] border-dashed border-foreground p-10 text-center font-mono uppercase transition ${
                    dragging
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:shadow-[5px_5px_0_0_var(--foreground)]'
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                            upload(file);
                        }

                        event.target.value = '';
                    }}
                />
                {processing ? (
                    <>
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Uploading…{' '}
                            {progress ? `${progress.percentage}%` : ''}
                        </p>
                    </>
                ) : (
                    <>
                        <Upload className="size-6 text-muted-foreground" />
                        <p className="font-medium">
                            Drop a PDF here or click to upload
                        </p>
                        <p className="text-sm text-muted-foreground">
                            PDF files up to 100 MB
                        </p>
                    </>
                )}
            </label>

            {docs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                    Your library is empty. Upload a PDF to start studying.
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {docs.map((doc) => (
                        <Card
                            key={doc.id}
                            className="group relative flex flex-col"
                        >
                            <CardHeader className="flex-row items-start gap-3 space-y-0">
                                <FileText className="mt-0.5 size-8 shrink-0 text-muted-foreground" />
                                <CardTitle className="line-clamp-2 text-base leading-snug">
                                    {doc.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <StatusBadge status={doc.status} />
                                    <span>
                                        {doc.page_count
                                            ? `${doc.page_count} pages · `
                                            : ''}
                                        {formatBytes(doc.size_bytes)}
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter className="gap-2">
                                <Button asChild size="sm" className="flex-1">
                                    <Link href={documents.show(doc.id).url}>
                                        Open
                                    </Link>
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setToDelete(doc)}
                                    aria-label="Delete document"
                                >
                                    <Trash2 className="size-4 text-destructive" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog
                open={toDelete !== null}
                onOpenChange={(open) => !open && setToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete document</DialogTitle>
                        <DialogDescription>
                            Delete “{toDelete?.title}” and all of its
                            highlights, notes, and drawings? This cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
