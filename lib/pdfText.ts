// lib/pdfText.ts - robust server-side PDF text extraction.
// Primary: unpdf (serverless-safe, no worker file needed on Vercel).
// Fallback: pdf-parse. Returns combined text + per-page breakdown for source traceability.

export type PdfPage = { page: number; text: string };

export async function extractPdfPages(buffer: Buffer): Promise<PdfPage[]> {
  try {
    const { extractText }: any = await import("unpdf");
    const out = await extractText(new Uint8Array(buffer), { mergePages: false });
    const raw: unknown = (out as any).text;
    const arr: string[] = Array.isArray(raw) ? raw as string[] : [String(raw ?? "")];
    const pages: PdfPage[] = arr
      .map((t, i) => ({ page: i + 1, text: String(t ?? "").replace(/\s+/g, " ").trim() }))
      .filter((p) => p.text.length > 0);
    if (pages.length > 0) return pages;
  } catch (e) {
    console.warn("unpdf extraction failed, trying pdf-parse fallback.", e);
  }
  try {
    const mod: any = await import("pdf-parse");
    const pdfParse = mod.default || mod;
    const out = await pdfParse(buffer);
    const text = ((out.text || "") as string).trim();
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
