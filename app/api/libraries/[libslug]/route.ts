// app/api/[libslug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Library } from "@/models/Library";

export async function GET(
  request: NextRequest,
    context: { params: Promise<{ libslug: string }> }
    ) {
      await connectToDatabase();

        const params = await context.params;  // Await the Promise!
          const { libslug } = params;

            const library = await Library.findOne({ slug: libslug });

              if (!library) {
                  return NextResponse.json(
                        { error: "Library not found" },
                              { status: 404 }
                                  );
                                    }

                                      return NextResponse.json(library);
                                      }

                                      export async function PUT(
                                        request: NextRequest,
                                          context: { params: Promise<{ libslug: string }> }
                                          ) {
                                            await connectToDatabase();

                                              const params = await context.params;  // Await the Promise!
                                                const { libslug } = params;
                                                  const body = await request.json();

                                                    // Verify slug matches
                                                      if (body.slug !== libslug) {
                                                          return NextResponse.json(
                                                                { error: "Slug cannot be changed" },
                                                                      { status: 400 }
                                                                          );
                                                                            }

                                                                              const library = await Library.findOneAndUpdate(
                                                                                  { slug: libslug },
                                                                                      body,
                                                                                          { new: true, runValidators: true }
                                                                                            );

                                                                                              if (!library) {
                                                                                                  return NextResponse.json(
                                                                                                        { error: "Library not found" },
                                                                                                              { status: 404 }
                                                                                                                  );
                                                                                                                    }

                                                                                                                      return NextResponse.json(library);
                                                                                                                      }

                                                                                                                      export async function DELETE(
                                                                                                                        request: NextRequest,
                                                                                                                          context: { params: Promise<{ libslug: string }> }
                                                                                                                          ) {
                                                                                                                            await connectToDatabase();

                                                                                                                              const params = await context.params;  // Await the Promise!
                                                                                                                                const { libslug } = params;

                                                                                                                                  const library = await Library.findOneAndDelete({ slug: libslug });

                                                                                                                                    if (!library) {
                                                                                                                                        return NextResponse.json(
                                                                                                                                              { error: "Library not found" },
                                                                                                                                                    { status: 404 }
                                                                                                                                                        );
                                                                                                                                                          }

                                                                                                                                                            return NextResponse.json({ message: "Library deleted" });
                                                                                                                                                            }
                                                                                                                                                            