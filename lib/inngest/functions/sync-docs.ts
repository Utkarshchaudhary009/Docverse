// inngest/functions/sync-docs.js
import { inngest } from '@/lib/inngest/client'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import {embedAndStore} from "@/lib/pinecone/embed-store"
// lib/getDefaultLlmTxt.ts

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 250,
  chunkOverlap: 30,
}); 

export async function getDefaultLlmTxtUrl(): Promise<{llm_txt_url:"string",library:"string"} | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "https://upgraded-potato-9rxwr6gvp7xcp7jg-3000.app.github.dev/"}/api/libraries/default-llm-txt`,
      {
        cache: "no-store", // Fresh data every time
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json() as { llm_txt_url: "string",library:"string"} | null;
    return data ?? null;
  } catch (error) {
    console.error("Failed to fetch default LLM txt:", error);
    return null;
  }
}

// Define function with CRON schedule directly!
export const syncDocs = inngest.createFunction(
  { id: 'sync-docs-daily' },
  { cron: 'TZ=Asia/Kolkata 0 0 * * *' }, // Daily at midnight IST
  async ({ step }) => {
    const data = await getDefaultLlmTxtUrl();

    if (data){
    // Step 2: Fan-out - process each URL
    await step.run('fan-out', async () => {
        await inngest.send({
          name: 'docs/page.process',
          data: data
        })
    })

    return { success: true, url: data.llm_txt_url, library: data.library}
  }
}
)

// Process individual pages
export const processPage = inngest.createFunction(
  { 
    id: 'process-page',
    concurrency: 10 // Process 10 at a time
  },
  { event: 'docs/page.process' },
  async ({ event, step }) => {
    const { url , library} = event.data
    
    // Each step is separate Vercel call
    const doc = await step.run('scrape', async () => {
      return await fetch(url).then(r => r.text())
    })
    
    const chunks = await step.run('chunk', async () => {
      return await splitter.splitText(doc);
    })
    
    const embeddings = await step.run('embed', async () => {
      return await embedAndStore(chunks,library)
    })
    
    return { url, success: true }
  }
)
