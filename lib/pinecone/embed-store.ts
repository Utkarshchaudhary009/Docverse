import { embedMany } from 'ai';
import { embeddingModel, pinecone } from './clients';

export async function embedAndStore(
  texts: string[],
  library:string,
  metadata?: Record<string, any>[]
) {
  const indexName = process.env.PINECONE_INDEX!;
  const index = pinecone.Index(indexName);
  
  // Generate embeddings for all texts
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  });
  
  // Prepare vectors for Pinecone
  const vectors = embeddings.map((embedding, i) => ({
    id: `doc-${Date.now()}-${i}`,
    values: embedding,
    metadata: {
      text: texts[i],
      library,
      ...(metadata?.[i] || {}),
    },
  }));
  
  // Upsert to Pinecone
  await index.upsert(vectors);
  
  return vectors;
}
