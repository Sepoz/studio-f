import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Extracts plain text from a single page using the already-parsed pdf.js
 * document, so the AI features never re-parse the PDF server-side (which
 * exhausts memory on large files).
 */
export async function extractPageText(
    pdf: PDFDocumentProxy,
    page: number,
): Promise<string> {
    const loaded = await pdf.getPage(page);
    const content = await loaded.getTextContent();

    return content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extracts document text page-by-page, stopping once `maxChars` is reached to
 * bound the request payload (whole-document summaries use the leading text).
 */
export async function extractDocText(
    pdf: PDFDocumentProxy,
    maxChars = 12000,
): Promise<string> {
    let out = '';

    for (
        let page = 1;
        page <= pdf.numPages && out.length < maxChars;
        page += 1
    ) {
        out += `${await extractPageText(pdf, page)}\n\n`;
    }

    return out.slice(0, maxChars).trim();
}
