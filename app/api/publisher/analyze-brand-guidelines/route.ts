import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";

interface Violation {
  rule_type?: string;
  evidence_text?: string;
  confidence?: number;
  source?: string;
  [key: string]: unknown;
}

interface AnalysisResult {
  violations?: Violation[];
  results?: Array<{ violations?: Violation[] }>;
  [key: string]: unknown;
}

function extractViolations(data: AnalysisResult | null): Violation[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Violation[];
  if (data.violations && Array.isArray(data.violations)) return data.violations;
  if (data.results && Array.isArray(data.results)) {
    return data.results.flatMap((r) => r.violations || []);
  }
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const creativeFile = formData.get("creative");
    const fromLines = formData.get("fromLines") as string | null;
    const subjectLines = formData.get("subjectLines") as string | null;

    if (
      !creativeFile ||
      typeof creativeFile === "string" ||
      !("size" in creativeFile)
    ) {
      return NextResponse.json(
        { error: "Creative file is required" },
        { status: 400 }
      );
    }

    const pythonServiceUrl = env.BRAND_GUIDELINES_URL;

    if (!pythonServiceUrl) {
      return NextResponse.json(
        { error: "Brand Guidelines service URL is not configured" },
        { status: 500 }
      );
    }

    const requests: Promise<Response>[] = [];

    const mainFormData = new FormData();
    mainFormData.append("creative_file", creativeFile);
    requests.push(
      fetch(`${pythonServiceUrl}/v1/analyze`, {
        method: "POST",
        body: mainFormData,
        signal: AbortSignal.timeout(60_000),
      })
    );

    const hasCopy =
      (fromLines && fromLines.trim().length > 0) ||
      (subjectLines && subjectLines.trim().length > 0);
    if (hasCopy) {
      const copyData = {
        fromLines: fromLines
          ? fromLines
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
          : [],
        subjectLines: subjectLines
          ? subjectLines
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
          : [],
      };

      const combinedHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Email Copy</title></head>
          <body>
            <h1>Subject Lines</h1>
            <ul>${copyData.subjectLines.map((l) => `<li>${l}</li>`).join("")}</ul>
            <h1>From Lines</h1>
            <ul>${copyData.fromLines.map((l) => `<li>${l}</li>`).join("")}</ul>
          </body>
        </html>
      `;

      const copyBlob = new Blob([combinedHtml], {
        type: "text/html",
      });
      const copyFormData = new FormData();
      copyFormData.append("creative_file", copyBlob, "copy_metadata.html");

      requests.push(
        fetch(`${pythonServiceUrl}/v1/analyze`, {
          method: "POST",
          body: copyFormData,
          signal: AbortSignal.timeout(60_000),
        })
      );
    }

    const responses = await Promise.all(requests);
    const allViolations: Violation[] = [];

    for (const res of responses) {
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          "Brand Guidelines Python API returned non-OK status:",
          res.status,
          errorText
        );
        return NextResponse.json(
          { error: "Brand Guidelines analysis failed for one or more files" },
          { status: res.status }
        );
      }
      const data = (await res.json()) as AnalysisResult;
      allViolations.push(...extractViolations(data));
    }

    const status = allViolations.length === 0 ? "pass" : "fail";

    return NextResponse.json({
      success: true,
      data: { status, violations: allViolations },
    });
  } catch (error: unknown) {
    console.error("Brand Guidelines Pipeline Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to run Brand Guidelines analysis pipeline";
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
