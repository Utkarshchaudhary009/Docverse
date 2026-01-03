import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Library } from "@/lib/mongodb/models/Library";

export async function GET() {
  await connectToDatabase();
    const libs = await Library.find().sort({ created_at: -1 }).limit(50);
      return NextResponse.json(libs);
      }

      export async function POST(req: Request) {
        await connectToDatabase();
          const body = await req.json();

            const lib = await Library.create({
                slug: body.slug,
                    name: body.name,
                        description: body.description,
                            category: body.category,
                                logo_url: body.logo_url,
                                    official_docs_url: body.official_docs_url,
                                        github_url: body.github_url,
                                            llm_txt_url: body.llm_txt_url,
                                                mcp_endpoint: body.mcp_endpoint,
                                                    vector_namespace: body.vector_namespace,
                                                        is_active: body.is_active,
                                                          });

                                                            return NextResponse.json(lib, { status: 201 });
                                                            }
