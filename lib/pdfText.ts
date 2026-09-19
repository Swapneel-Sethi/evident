// lib/pdfText.ts - robust server-side PDF text extraction.
// Primary: pdfjs-dist (handles PDFs that pdf-parse chokes on).
// Fallback: pdf-parse. Returns combined text + per-page breakdown for source traceability.

export type PdfPage = { page: number; text: string };

export async function extractPdfPages(buffer: Buffer): Promise<PdfPage[]> {
  const data = new Uint8Array(buffer);
  try {
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({
      data,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;
    const pages: PdfPage[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = (content.items as any[]).map((it) => it.str ?? "").join(" ");
      pages.push({ page: i, text: text.replace(/\s+/g, " ").trim() });
    }
    if (typeof (doc as any).destroy === "function") {
      await (doc as any).destroy().catch(() => {});
    }
    if (pages.some((p) => p.text.length > 0)) return pages;
  } catch (e) {
    console.warn("pdfjs extraction failed, trying pdf-parse fallback.", e);
  }
  try {
    const mod: any = await import("pdf-parse");
    const pdfParse = mod.default || mod;
    const out = await pdfParse(Buffer.from(data));
    const text = (out.text || "").trim();
    if (text) return [{ page: 1, text }];
  } catch (e) {
    console.warn("pdf-parse fallback failed.", e);
  }
  return [];
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pages = await extractPdfPages(buffer);
  return pages.map((p) => p.text).join("\n").trim();
}
