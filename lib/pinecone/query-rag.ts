import { embed } from 'ai';
import { embeddingModel, pinecone } from './clients';

export async function getContextFromQuery(
  query: string,
  topK: number = 10,
  library:string,
  minScore: number = 0.7
) {
  const indexName = process.env.PINECONE_INDEX!;
  const index = pinecone.Index(indexName);
  
  // Generate embedding for the query
  const { embedding } = await embed({
    model: embeddingModel,
    value: query,
  });
  
  // Query Pinecone
  const queryResponse = await index.query({
    vector: embedding,
    topK,
    filter:{library},
    includeMetadata: true
  });
  
  // Filter by score and extract context
//   const matches = queryResponse.matches?.filter(
//     (match) => match.score && match.score >= minScore
//   ) || [];
  
  // Return context as text
  const context = queryResponse.matches
    .map((match) => match.metadata?.text)
    .filter(Boolean)
    .join('\n\n');
  
  return { context, queryResponse.matches };
}
