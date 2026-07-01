import { FileText, Loader2, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface AiPanelProps {
    title: string;
    text: string;
    isStreaming: boolean;
    currentPage: number;
    onSummarizeDocument: () => void;
    onSummarizePage: () => void;
}

export function AiPanel({
    title,
    text,
    isStreaming,
    currentPage,
    onSummarizeDocument,
    onSummarizePage,
}: AiPanelProps) {
    return (
        <aside className="flex w-96 shrink-0 flex-col border-l-[3px] border-foreground bg-background">
            <div className="flex items-center gap-2 border-b-[3px] border-foreground px-4 py-3">
                <Sparkles className="size-4 text-foreground" />
                <h2 className="font-heading text-sm font-bold tracking-tight uppercase">
                    AI Assistant
                </h2>
            </div>

            <div className="flex flex-col gap-2 border-b-[3px] border-foreground p-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    disabled={isStreaming}
                    onClick={onSummarizeDocument}
                >
                    <FileText className="size-4" />
                    Summarize document
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    disabled={isStreaming}
                    onClick={onSummarizePage}
                >
                    <FileText className="size-4" />
                    Summarize page {currentPage}
                </Button>
                <p className="text-xs text-muted-foreground">
                    Tip: hover a highlight and click the ✨ icon to explain it.
                </p>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4">
                    {title && (
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            {title}
                            {isStreaming && (
                                <Loader2 className="size-3 animate-spin" />
                            )}
                        </div>
                    )}

                    {text ? (
                        <div className="ai-markdown text-sm leading-relaxed text-foreground">
                            <Markdown remarkPlugins={[remarkGfm]}>
                                {text}
                            </Markdown>
                        </div>
                    ) : isStreaming ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Generate a summary or explain a highlight to see AI
                            output here.
                        </p>
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
