import { pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

/**
 * Wire the pdf.js worker. The `new URL(..., import.meta.url)` form lets Vite
 * bundle the ESM worker as a hashed local asset, keeping the worker version
 * locked to the `pdfjs-dist` version react-pdf renders with (avoids the
 * "API version does not match Worker version" crash) and works fully offline.
 */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

export { pdfjs };
