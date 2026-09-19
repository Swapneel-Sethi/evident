// pages/api/upload-job.ts
// API route to accept a job description PDF or plain text file via multipart/form-data,
// store the file in Supabase storage bucket `job_descriptions`, extract its text (using pdf-parse for PDFs),
// insert a record into the `job_documents` table, and return metadata about the stored job document.

import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "../../lib/supabaseClient";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { IncomingForm } from "formidable";

// Disable Next.js body parsing to handle multipart/form-data.
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Parse a multipart/form-data request using Formidable.
 * Resolves with the parsed fields and files.
 */
function parseForm(req: NextApiRequest): Promise<{ fields: any; files: any }> {
  const form = new IncomingForm({
    keepExtensions: true, // Preserve original file extensions.
    maxFileSize: 10 * 1024 * 1024, // 10 MiB limit.
    uploadDir: os.tmpdir(), // Temporarily store uploaded file.
  });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

/**
 * Extract plain text from a PDF buffer using pdf-parse.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const mod: any = await import("pdf-parse");
    const pdfParse = mod.default || mod;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (e) {
    console.warn("pdf-parse failed, returning empty string.", e);
    return "";
  }
}

/**
 * Main handler for the API route.
 */
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

    // Expect a file input (any field name). Grab the first file.
    const fileEntry = Object.values(files)[0];
    if (!fileEntry) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const uploadedFile: any = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry;

    const tmpPath: string = uploadedFile.filepath || uploadedFile.path;
    const originalName: string = uploadedFile.originalFilename || uploadedFile.name || "file";
    const ext = path.extname(originalName).toLowerCase();

    // Accept only PDF or plain text files.
    if (![".pdf", ".txt"].includes(ext)) {
      await fs.unlink(tmpPath).catch(() => {});
      return res.status(400).json({ error: "Only PDF or TXT files are allowed" });
    }

    // Read the uploaded file into a buffer.
    const fileBuffer = await fs.readFile(tmpPath);

    // Extract text based on file type.
    let extractedText: string;
    if (ext === ".pdf") {
      extractedText = await extractPdfText(fileBuffer);
    } else {
      // Plain text file – interpret as UTF‑8.
      extractedText = fileBuffer.toString("utf-8");
    }

    // Determine required fields (formidable returns arrays).
    const norm = (v: any) => (Array.isArray(v) ? v[0] : v);
    const workspaceId = norm(fields.workspaceId ?? fields.workspace_id);
    if (!workspaceId) {
      await fs.unlink(tmpPath).catch(() => {});
      return res.status(400).json({ error: "Missing workspaceId field" });
    }
    const title = norm(fields.title) || path.parse(originalName).name;

    // Upload the file to Supabase storage.
    const storagePath = `${Date.now()}_${originalName}`;
    const contentType = ext === ".pdf" ? "application/pdf" : "text/plain";
    const { error: uploadError } = await supabase.storage
      .from("job_descriptions")
      .upload(storagePath, fileBuffer, { contentType, upsert: false });

    // Remove temporary file.
    await fs.unlink(tmpPath).catch(() => {});

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.status(500).json({ error: "Failed to store file in Supabase" });
    }

    // Retrieve public URL (bucket must be public).
    const { data: publicData } = supabase.storage.from("job_descriptions").getPublicUrl(storagePath);

    // Insert a record into the job_documents table.
    const { data: insertData, error: dbError } = await supabase
      .from("job_documents")
      .insert([
        {
          workspace_id: workspaceId,
          title,
          content: {
            text: extractedText,
            source: {
              bucket: "job_descriptions",
              path: storagePath,
              url: publicData?.publicUrl ?? null,
            },
          },
        },
      ])
      .select();

    if (dbError) {
      console.error("Database insert error:", dbError);
      return res.status(500).json({ error: "Failed to record job document in database" });
    }

    const record = insertData && insertData[0];
    return res.status(200).json({
      id: record?.id,
      title: record?.title,
      workspace_id: record?.workspace_id,
      content: record?.content,
    });
  } catch (err: any) {
    // Handle Formidable size limit errors or other unexpected errors.
    if (err && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size exceeds 10 MiB limit" });
    }
    console.error("Upload-job handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
