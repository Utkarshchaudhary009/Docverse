import { Pinecone } from '@pinecone-database/pinecone';
import { google } from '@ai-sdk/google';

// Environment validation
if (!process.env.PINECONE_API_KEY) {
  console.error('❌ Missing PINECONE_API_KEY environment variable');
  throw new Error(
    'PINECONE_API_KEY is not configured. Please add it to your environment variables.'
  );
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const embeddingModel = google.embedding('gemini-embedding-001');
