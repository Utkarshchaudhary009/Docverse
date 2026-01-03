import { Pinecone } from '@pinecone-database/pinecone';
import { google } from '@ai-sdk/google';

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const embeddingModel = google.embedding('gemini-embedding-001');
