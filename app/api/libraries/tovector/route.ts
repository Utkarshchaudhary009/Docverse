// app/api/libraries/default-llm-txt/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/mongoose";
import { Library } from "@/lib/mongodb/models/Library";

export async function GET() {
  await connectToDatabase();

  const library = await Library.findOne(
    { vector_namespace: "default" },
    { llm_txt_url: 1, _id: 0 }
  );

  if (!library || !library.llm_txt_url) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(JSON.stringify({ llm_txt_url: library.llm_txt_url,library: library.slug }), {
    status: 200,
    headers: { "Content-Type": "json" },
  });
}