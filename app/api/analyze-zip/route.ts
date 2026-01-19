import JSZip from 'jszip';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    
    const stats = {
      fileCount: 0,
      totalSize: 0,
      hasHtml: false,
      hasImages: false,
      structure: [] as string[]
    };

    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        stats.fileCount++;
        stats.structure.push(relativePath);
        if (/\.html?$/i.test(relativePath)) stats.hasHtml = true;
        if (/\.(png|jpg|jpeg|gif)$/i.test(relativePath)) stats.hasImages = true;
      }
    });

    return NextResponse.json({
      success: true,
      analysis: stats,
      isValidCreative: stats.hasHtml || stats.hasImages
    });

  } catch (_error) {
    return NextResponse.json({ error: "Invalid ZIP file" }, { status: 400 });
  }
}
