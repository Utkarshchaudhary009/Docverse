// models/Library.ts
import mongoose, { Schema, models, model } from "mongoose";

export interface ILibrary {
  slug: string;
  name: string;
  description: string;
  category: "frontend" | "backend" | "language" | "database";
  logo_url?: string;
  official_docs_url: string;
  github_url?: string;
  llm_txt_url?: string;
  mcp_endpoint?: string;
  vector_namespace?: string;
  is_active?: boolean;
  total_docs?: number;
  total_searches?: number;
  created_at?: Date;
  updated_at?: Date;
}

const LibrarySchema = new Schema<ILibrary>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["frontend", "backend", "language", "database"],
    },

    logo_url: { type: String },
    official_docs_url: { type: String, required: true },
    github_url: { type: String },
    llm_txt_url: { type: String },
    mcp_endpoint: { type: String },

    vector_namespace: { type: String, default: "default" },

    is_active: { type: Boolean, default: true },

    total_docs: { type: Number, default: 0 },
    total_searches: { type: Number, default: 0 },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const Library =
  models.Library || model<ILibrary>("Library", LibrarySchema);
