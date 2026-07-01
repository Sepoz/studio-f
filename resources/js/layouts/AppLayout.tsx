import { Link } from '@inertiajs/react';
import { BookOpen, Library } from 'lucide-react';
import type { PropsWithChildren, ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import * as documents from '@/routes/documents';

interface AppLayoutProps {
    /** Optional header content rendered in the top bar (e.g. document title, actions). */
    header?: ReactNode;
    /** When true the main area fills the viewport without padding (reader view). */
    flush?: boolean;
}

export default function AppLayout({
    header,
    flush = false,
    children,
}: PropsWithChildren<AppLayoutProps>) {
    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
                <aside className="flex w-56 shrink-0 flex-col border-r-[3px] border-foreground bg-sidebar text-sidebar-foreground">
                    <div className="flex h-14 items-center gap-2 border-b-[3px] border-foreground px-4 font-heading text-lg font-bold tracking-tight uppercase">
                        <BookOpen className="size-5" />
                        <span>Studio</span>
                    </div>
                    <nav className="flex flex-col gap-2 p-3 text-sm">
                        <Link
                            href={documents.index().url}
                            className="flex items-center gap-2 border-[3px] border-foreground bg-sidebar-accent px-3 py-2 font-mono font-bold text-sidebar-accent-foreground uppercase shadow-[3px_3px_0_0_var(--foreground)]"
                        >
                            <Library className="size-4" />
                            Library
                        </Link>
                    </nav>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="flex h-14 shrink-0 items-center gap-3 border-b-[3px] border-foreground px-4">
                        {header ?? (
                            <div className="font-heading font-bold uppercase">
                                Library
                            </div>
                        )}
                    </header>
                    <main
                        className={cn(
                            'min-h-0 flex-1',
                            flush ? 'overflow-hidden' : 'overflow-auto p-6',
                        )}
                    >
                        {children}
                    </main>
                </div>
            </div>
            <Toaster richColors position="bottom-right" />
        </TooltipProvider>
    );
}
