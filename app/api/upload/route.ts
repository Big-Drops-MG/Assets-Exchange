import JSZip from 'jszip';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { saveBuffer } from '@/lib/fileStorage';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const smartDetection = formData.get('smartDetection') === 'true';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const isZip = file.type.includes('zip') || /\.zip$/i.test(file.name);

    // =========================================================
    // PATH A: SMART ZIP EXTRACTION (Legacy Logic Ported)
    // =========================================================
    if (isZip && smartDetection) {
      const zipId = uuidv4();
      const zip = await JSZip.loadAsync(buffer);
      const items: Array<{
        id: string;
        name: string;
        url: string;
        size: number;
        type: string;
        html?: boolean;
      }> = [];
      const entries = Object.values(zip.files);
      
      // Safety Limit
      if (entries.length > 50) {
        return NextResponse.json({ error: 'ZIP contains too many files (Limit: 50)' }, { status: 400 });
      }

      let imagesCount = 0;
      let htmlCount = 0;

      for (const entry of entries) {
        if (entry.dir) continue;
        if (entry.name.startsWith('__') || entry.name.startsWith('.')) continue; // Skip hidden

        const content = await entry.async('nodebuffer');
        const type = guessType(entry.name);
        
        // Upload extracted asset to Vercel Blob
        const saved = await saveBuffer(content, entry.name.split('/').pop() || 'file', `extracted/${zipId}`);
        
        const isImg = type.startsWith('image/');
        const isHtml = type.includes('html');
        if (isImg) imagesCount++;
        if (isHtml) htmlCount++;

        items.push({
          id: saved.id,
          name: entry.name,
          url: saved.url,
          size: content.length,
          type: isImg ? "image" : isHtml ? "html" : "other",
          html: isHtml
        });
      }

      // Logic: If 1 HTML + Images -> Single Creative. Otherwise -> Multiple.
      const isSingleCreative = (htmlCount === 1);

      return NextResponse.json({
        success: true,
        zipAnalysis: {
          uploadId: zipId,
          isSingleCreative,
          items,
          counts: { images: imagesCount, htmls: htmlCount, total: items.length }
        }
      });
    }

    // =========================================================
    // PATH B: STANDARD SINGLE UPLOAD
    // =========================================================
    const saved = await saveBuffer(buffer, file.name);
    
    /* 🚧 SECURITY TODO: 
       The Python Malware Service integration is disabled for now.
       Uncomment the block below when the Checking Model is ready.
    */
    /*
    if (process.env.PYTHON_SERVICE_URL) {
        fetch(`${process.env.PYTHON_SERVICE_URL}/scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_url: saved.url }),
        }).catch(err => console.error("Scan trigger error:", err));
    }
    */

    return NextResponse.json({
      success: true,
      file: {
        fileId: saved.id,
        fileName: saved.fileName,
        fileUrl: saved.url,
        fileSize: saved.size,
        fileType: file.type || guessType(file.name),
        uploadDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Upload Processing Error:", error);
    return NextResponse.json({ error: "Server processing failed" }, { status: 500 });
  }
}

// Helper to determine mime type from extension
function guessType(name: string) {
  const n = name.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(n)) return 'image/' + n.split('.').pop();
  if (/\.html?$/.test(n)) return 'text/html';
  if (/\.zip$/.test(n)) return 'application/zip';
  return 'application/octet-stream';
}
