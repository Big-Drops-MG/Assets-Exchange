import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { saveBuffer } from "@/lib/fileStorage";
import { sanitizeFilename } from "@/lib/security/route";
import { validateBufferMagicBytes } from "@/lib/security/validateBuffer";
import { ZipParserService } from "@/lib/services/zip-parser.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileBuffer: Buffer;
    let fileName: string;
    let smartDetection = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      smartDetection = formData.get("smartDetection") === "true";

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      fileBuffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
    } else {
      const url = new URL(req.url);
      smartDetection = url.searchParams.get("smartDetection") === "true";

      const rawFilename = url.searchParams.get("filename") || "upload.zip";
      fileName = decodeURIComponent(rawFilename);

      fileBuffer = Buffer.from(await req.arrayBuffer());

      if (!fileBuffer || fileBuffer.length === 0) {
        return NextResponse.json({ error: "Empty file body" }, { status: 400 });
      }
    }

    //validate buffer magic bytes
    const v = await validateBufferMagicBytes(fileBuffer);

    if (!v.ok) {
      return NextResponse.json(
        { error: "Invalid file", reason: v.reason },
        { status: 415 }
      );
    }

    const isZip = v.detectedMime.includes("zip") || v.detectedExt === "zip";

    if (isZip && smartDetection) {
      const zipId = uuidv4();

      const { entries, analysis } =
        await ZipParserService.parseWithAllEntries(fileBuffer);

      if (entries.length > 50) {
        return NextResponse.json(
          { error: "ZIP contains too many files (Limit: 50)" },
          { status: 400 }
        );
      }

      const items: Array<{
        id: string;
        name: string;
        url: string;
        size: number;
        type: string;
        isDependency: boolean;
        dependencyType?: string;
        parentPath?: string;
      }> = [];
      let imagesCount = 0;
      let htmlCount = 0;

      for (const entry of entries) {
        const normalizedPath = entry.name
          .replace(/\\/g, "/")
          .replace(/^\/+/, "")
          .replace(/\.\.+\//g, "")
          .replace(/\/+/g, "/");

        const pathParts = normalizedPath.split("/");
        const fileNameOnly = pathParts.pop() || "file";
        const subPath = pathParts.length > 0 ? pathParts.join("/") : "";

        if (
          fileNameOnly === ".DS_Store" ||
          fileNameOnly === "Thumbs.db" ||
          fileNameOnly === "desktop.ini" ||
          normalizedPath.startsWith("__MACOSX/") ||
          fileNameOnly.startsWith("._")
        ) {
          continue;
        }

        const v = await validateBufferMagicBytes(entry.content);

        if (!v.ok) {
          return NextResponse.json(
            {
              error: "ZIP contains invalid file",
              file: entry.name,
              reason: v.reason,
            },
            { status: 415 }
          );
        }

        const detectedType = v.detectedMime;

        const saved = await saveBuffer(
          entry.content,
          sanitizeFilename(fileNameOnly),
          `extracted/${zipId}${subPath ? "/" + subPath : ""}`
        );

        if (detectedType.startsWith("image/")) imagesCount++;
        if (detectedType.includes("html")) htmlCount++;

        items.push({
          id: saved.id,
          name: normalizedPath,
          url: saved.url,
          size: entry.content.length,
          type: detectedType,
          isDependency: entry.isDependency,
          dependencyType: entry.dependencyType,
          parentPath: entry.parentPath,
        });
      }

      return NextResponse.json({
        success: true,
        zipAnalysis: {
          uploadId: zipId,
          isSingleCreative: htmlCount === 1,
          items,
          counts: { images: imagesCount, htmls: htmlCount },
          dependencyAnalysis: analysis,
          mainCreative:
            htmlCount === 1
              ? items.find((i) => i.type.includes("html"))
              : undefined,
        },
      });
    }

    //change saving file ,sanititize filename+store safe type
    const safeName = sanitizeFilename(fileName);
    const saved = await saveBuffer(fileBuffer, safeName);

    return NextResponse.json({
      success: true,
      file: {
        fileId: saved.id,
        fileName: saved.fileName,
        fileUrl: saved.url,
        fileSize: saved.size,
        fileType: v.detectedMime, //changed to detected mime type
        uploadDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Upload Processing Error:", error);
    return NextResponse.json(
      {
        error: "Server processing failed",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
