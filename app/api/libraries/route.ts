// app/api/libraries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ToolLoopAgent, stepCountIs,Output } from 'ai';
import { google } from "@ai-sdk/google";

import { connectToDatabase } from "@/lib/mongodb/mongoose";
import { Library } from "@/lib/mongodb/models/Library";

// GET /api/libraries -> latest 50 libs
export async function GET() {
  await connectToDatabase();
  const libs = await Library.find().sort({ created_at: -1 }).limit(50);
  return NextResponse.json(libs);
}

// Zod schema for AI-generated library object
const LibrarySchema = z.object({
  slug: z.string().describe("URL-friendly slug for the library name, kebab-case."),
  name: z.string().describe("Official name of the library."),
  description: z
    .string()
    .describe("1–3 sentence description of what this library does."),
  category: z
    .enum(["frontend", "backend", "language", "database"])
    .describe("Best matching category."),
  logo_url: z
    .string()
    .url()
    .optional()
    .describe("Direct URL to the official logo or main image if known."),
  official_docs_url: z
    .string()
    .url()
    .describe("Official documentation website URL."),
  github_url: z
    .string()
    .url()
    .optional()
    .describe("Official GitHub repository URL if it exists."),
  llm_txt_url: z
    .string()
    .url()
    .optional()
    .describe("URL to a raw text/markdown docs file, if available."),
});

// POST /api/libraries -> generate + save one lib from libName
export async function POST(req: NextRequest) {
  await connectToDatabase();

  const { libName }: { libName: string } = await req.json();

  if (!libName || typeof libName !== "string") {
    return NextResponse.json(
      { error: "libName is required and must be a string" },
      { status: 400 }
    );
  }

  // Check if already exists by name or slug
  const existing = await Library.findOne({
    $or: [{ name: libName }, { slug: libName.toLowerCase().replace(/\s+/g, "-") }],
  });

  if (existing) {
    return NextResponse.json(
      { error: "Library already exists", library: existing },
      { status: 409 }
    );
  }

  // AI generation using Gemini via @ai-sdk/google + generateObject
  const myAgent = new ToolLoopAgent({
  model: google("gemini-2.5-flash-lite-preview-09-2025"),
    instructions:"You are an assistant that generates structured metadata for programming libraries. Always return valid JSON matching the provided Zod schema.",
    output: Output.object({schema:LibrarySchema}),
  stopWhen: stepCountIs(20), // Allow up to 20 steps
  });

const {output: aiGenerated} = await myAgent.generate({
  prompt: `Generate metadata for the library named "${libName}". 
Return realistic, production-ready values. 
If some URL is unknown, omit the field instead of guessing.`,
});

  // Fallback: ensure slug at least exists
  const slug =
    aiGenerated.slug ||
    libName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  // Create in MongoDB
  const lib = await Library.create({
    slug,
    name: aiGenerated.name,
    description: aiGenerated.description,
    category: aiGenerated.category,
    logo_url: aiGenerated.logo_url,
    official_docs_url: aiGenerated.official_docs_url,
    github_url: aiGenerated.github_url,
    llm_txt_url: aiGenerated.llm_txt_url,
  });

  return NextResponse.json(lib, { status: 201 });
}
