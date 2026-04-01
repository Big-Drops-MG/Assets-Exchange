import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

import { db } from "@/lib/db";
import { offers } from "@/lib/schema";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const formData = await req.formData();
    const creativeFile = formData.get("creative") as File | null;
    const offerId = formData.get("offerId") as string | null;

    if (!creativeFile) {
      return NextResponse.json(
        { error: "Creative file is required" },
        { status: 400 }
      );
    }

    let offerName: string | null = null;
    if (offerId) {
      try {
        const [offer] = await db
          .select({ offerName: offers.offerName })
          .from(offers)
          .where(eq(offers.id, offerId))
          .limit(1);
        offerName = offer?.offerName ?? null;
      } catch {
        console.warn("Could not look up offer name for offerId:", offerId);
      }
    }

    const isHtml =
      creativeFile.type === "text/html" ||
      creativeFile.name.toLowerCase().endsWith(".html");

    const offerContext = offerName ? `The offer name is: "${offerName}".` : "";

    const baseInstruction = `You are an expert email marketing copywriter.
Generate 20 distinct "From" sender names and 20 compelling "Subject" lines that match the creative and offer.
${offerContext}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "fromLines": ["sender name 1", "sender name 2", ... up to 20],
  "subjectLines": ["subject 1", "subject 2", ... up to 20]
}`;

    let aiResponse;

    if (isHtml) {
      const rawHtml = await creativeFile.text();
      const creativeText = rawHtml
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 5000);

      aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `${baseInstruction}\n\nCreative text content:\n${creativeText}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
    } else {
      const arrayBuffer = await creativeFile.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = creativeFile.type || "image/jpeg";

      aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: baseInstruction,
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
    }

    const aiResultRaw = aiResponse.choices[0].message.content ?? "{}";

    let parsedCopy: { fromLines?: string[]; subjectLines?: string[] } = {};
    try {
      parsedCopy = JSON.parse(aiResultRaw) as typeof parsedCopy;
    } catch {
      console.error("Failed to parse OpenAI JSON:", aiResultRaw);
      return NextResponse.json(
        { error: "AI returned invalid JSON response" },
        { status: 500 }
      );
    }

    const fromLines = parsedCopy.fromLines ?? [];
    const subjectLines = parsedCopy.subjectLines ?? [];

    let pythonAnalysis: Record<string, unknown> = {};

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
    if (pythonServiceUrl) {
      try {
        const pythonFormData = new FormData();
        pythonFormData.append("creative_file", creativeFile);

        const pythonResponse = await fetch(`${pythonServiceUrl}/v1/analyze`, {
          method: "POST",
          body: pythonFormData,
          signal: AbortSignal.timeout(60_000),
        });

        if (pythonResponse.ok) {
          pythonAnalysis = (await pythonResponse.json()) as Record<
            string,
            unknown
          >;
        } else {
          console.warn(
            "Python API returned non-OK status:",
            pythonResponse.status,
            await pythonResponse.text()
          );
        }
      } catch (pythonError) {
        console.error("Python analysis error (non-fatal):", pythonError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        fromLines: fromLines.join("\n"),
        subjectLines: subjectLines.join("\n"),
        analysis: pythonAnalysis,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to run analysis pipeline";
    console.error("Pipeline Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
