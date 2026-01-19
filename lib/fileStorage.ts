import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export async function saveBuffer(buffer: Buffer, filename: string, folder: string = "uploads") {
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${folder}/${nanoid(8)}-${safeName}`;

  const blob = await put(path, buffer, {
    access: "public",
    addRandomSuffix: false,
  });

  return {
    id: blob.url,
    url: blob.url,
    fileName: safeName,
    originalName: filename,
    size: buffer.length
  };
}

export async function getFilePath(folderId: string, relPath: string) {
  return `${folderId}/${relPath}`;
}
