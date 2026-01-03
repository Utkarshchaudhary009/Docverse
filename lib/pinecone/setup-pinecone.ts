// lib/setup-pinecone.ts
import { pinecone } from './clients';

export async function setupPineconeIndex() {
  const indexName = process.env.PINECONE_INDEX!;
  
  const existingIndexes = await pinecone.listIndexes();
  const indexExists = existingIndexes.indexes?.some(
    (index) => index.name === indexName
  );
  
  if (!indexExists) {
    await pinecone.createIndex({
      name: indexName,
      dimension: 768, // gemini-embedding-001 dimensions
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
  }
  
  return pinecone.Index(indexName);
}
