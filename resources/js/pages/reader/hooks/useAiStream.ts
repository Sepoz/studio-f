import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
    explain as explainAction,
    summarize as summarizeAction,
} from '@/actions/App/Http/Controllers/Api/AiController';

interface AiStreamState {
    title: string;
    text: string;
    isStreaming: boolean;
}

/**
 * Streams AI responses (summary / explanation) from the backend, appending each
 * chunk to `text` as it arrives. A new request aborts any in-flight one.
 */
export function useAiStream(documentId: number) {
    const [state, setState] = useState<AiStreamState>({
        title: '',
        text: '',
        isStreaming: false,
    });
    const controllerRef = useRef<AbortController | null>(null);

    const run = useCallback(
        async (url: string, body: unknown, title: string) => {
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;

            setState({ title, text: '', isStreaming: true });

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'text/plain',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(body),
                    signal: controller.signal,
                });

                if (!response.ok || !response.body) {
                    throw new Error(
                        `Request failed with status ${response.status}`,
                    );
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                for (;;) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    const chunk = decoder.decode(value, { stream: true });
                    setState((current) => ({
                        ...current,
                        text: current.text + chunk,
                    }));
                }
            } catch {
                if (!controller.signal.aborted) {
                    toast.error(
                        'AI request failed. Check your Cortecs configuration.',
                    );
                }
            } finally {
                if (controllerRef.current === controller) {
                    setState((current) => ({ ...current, isStreaming: false }));
                }
            }
        },
        [],
    );

    const summarize = useCallback(
        (text: string, page?: number | null) =>
            run(
                summarizeAction.url(documentId),
                { text, page: page ?? null },
                page ? `Summary — page ${page}` : 'Document summary',
            ),
        [documentId, run],
    );

    const explain = useCallback(
        (text: string, page?: number | null) =>
            run(
                explainAction.url(documentId),
                { text, page: page ?? null },
                'Explanation',
            ),
        [documentId, run],
    );

    return { ...state, summarize, explain };
}
