import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { saveBuffer } from "@/lib/fileStorage";
import { validateBufferMagicBytes } from "@/lib/security/validateBuffer";
import { ZipParserService } from "@/lib/services/zip-parser.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // 1. Download the ZIP file from Blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ZIP from Blob: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 2. Process with ZipParserService
    // Note: ZipParserService has been updated to return HTMLDependencyMap[]
    // but for the upload-blob flow we still need to iterate over all files once.
    // We'll use a modified approach or assume Service still provides access to raw files if needed,
    // or we'll wrap the parsing to get all entries.

    const { entries, analysis } =
      await ZipParserService.parseWithAllEntries(fileBuffer);

    if (entries.length > 50) {
      return NextResponse.json(
        { error: "ZIP contains too many files (Limit: 50)" },
        { status: 400 }
      );
    }

    const zipId = uuidv4();
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
      const normalizedName = entry.name
        .replace(/^\/+/, "")
        .replace(/\.\.\//g, "")
        .replace(/\/+/g, "/");

      const basename = normalizedName.split("/").pop() ?? "";
      if (
        basename === ".DS_Store" ||
        basename === "Thumbs.db" ||
        basename === "desktop.ini" ||
        normalizedName.startsWith("__MACOSX/") ||
        basename.startsWith("._")
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

      // 3. Save extracted files to Blob (server-side)
      // Preserve full ZIP path structure by splitting name and path segments
      const lastSlashIndex = normalizedName.lastIndexOf("/");
      const fileName =
        lastSlashIndex === -1
          ? normalizedName
          : normalizedName.substring(lastSlashIndex + 1);
      const subPath =
        lastSlashIndex === -1
          ? ""
          : normalizedName.substring(0, lastSlashIndex);

      const saved = await saveBuffer(
        entry.content,
        fileName || "file",
        subPath ? `extracted/${zipId}/${subPath}` : `extracted/${zipId}`
      );

      if (detectedType.startsWith("image/")) imagesCount++;
      if (detectedType.includes("html")) htmlCount++;

      items.push({
        id: saved.id,
        name: normalizedName,
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
  } catch (error) {
    console.error("ZIP Processing Error:", error);
    return NextResponse.json(
      {
        error: "ZIP processing failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
