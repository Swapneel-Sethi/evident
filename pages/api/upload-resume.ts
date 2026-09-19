// pages/api/upload-resume.ts - mirror of upload-job, stores in candidate_resumes bucket + candidate_documents table
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "../../lib/supabaseClient";

export const config = { api: { bodyParser: false } };

async function parseForm(req: NextApiRequest): Promise<{ fields: any; files: any }> {
  const { IncomingForm } = await import("formidable");
  const os = await import("os");
  const form = new IncomingForm({ keepExtensions: true, maxFileSize: 10 * 1024 * 1024, uploadDir: os.tmpdir() });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!isSupabaseConfigured) {
    return res.status(500).json({ error: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." });
  }
  try {
    const { fields, files } = await parseForm(req);
    const fileEntry = Object.values(files)[0];
    if (!fileEntry) return res.status(400).json({ error: "No file uploaded" });
    const uploadedFile: any = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry;
    const { promises: fs } = await import("fs");
    const path = await import("path");
    const tmpPath: string = uploadedFile.filepath || uploadedFile.path;
    const originalName: string = uploadedFile.originalFilename || uploadedFile.name || "resume";
    const ext = path.extname(originalName).toLowerCase();
    if (![".pdf", ".txt"].includes(ext)) {
      await fs.unlink(tmpPath).catch(() => {});
      return res.status(400).json({ error: "Only PDF or TXT resumes allowed" });
    }
    const fileBuffer = await fs.readFile(tmpPath);
    let extractedText = "";
    if (ext === ".pdf") {
      const { extractPdfText } = await import("../../lib/pdfText");
      extractedText = await extractPdfText(fileBuffer);
      if (!extractedText.trim()) {
        await fs.unlink(tmpPath).catch(() => {});
        return res.status(400).json({ error: "We couldn't extract readable text from this PDF. If it is a scanned image, export it as a text-based PDF and retry." });
      }
    } else {
      extractedText = fileBuffer.toString("utf-8");
    }
    const norm = (v: any) => (Array.isArray(v) ? v[0] : v);
    const workspaceId = norm(fields.workspaceId ?? fields.workspace_id) as string;
    if (!workspaceId) {
      await fs.unlink(tmpPath).catch(() => {});
      return res.status(400).json({ error: "Missing workspaceId field" });
    }
    const storagePath = `${Date.now()}_${originalName}`;
    const { error: uploadError } = await supabase.storage.from("candidate_resumes").upload(storagePath, fileBuffer, {
      contentType: ext === ".pdf" ? "application/pdf" : "text/plain",
      upsert: false,
    });
    await fs.unlink(tmpPath).catch(() => {});
    if (uploadError) return res.status(500).json({ error: "Failed to store resume in Supabase" });
    const { data: publicData } = supabase.storage.from("candidate_resumes").getPublicUrl(storagePath);
    const { data: insertData, error: dbError } = await supabase.from("candidate_documents").insert([{
      workspace_id: workspaceId,
      file_name: originalName,
      content: { text: extractedText, source: { bucket: "candidate_resumes", path: storagePath, url: publicData?.publicUrl ?? null } },
    }]).select();
    if (dbError) return res.status(500).json({ error: "Failed to record resume in database" });
    return res.status(200).json({ record: insertData?.[0], textLength: extractedText.length });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
