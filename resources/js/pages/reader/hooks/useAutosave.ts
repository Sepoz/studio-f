import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a debounced version of `callback`. The latest callback reference is
 * always used, and any pending timer is cleared on unmount.
 */
export function useDebouncedCallback<A extends unknown[]>(
    callback: (...args: A) => void,
    delay: number,
): (...args: A) => void {
    const callbackRef = useRef(callback);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        callbackRef.current = callback;
    });

    useEffect(
        () => () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        },
        [],
    );

    return useCallback(
        (...args: A) => {
            if (timer.current) {
                clearTimeout(timer.current);
            }

            timer.current = setTimeout(
                () => callbackRef.current(...args),
                delay,
            );
        },
        [delay],
    );
}
