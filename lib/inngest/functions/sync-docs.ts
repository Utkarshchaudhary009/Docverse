// inngest/functions/sync-docs.ts
import { inngest } from '@/lib/inngest/client';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { embedAndStore } from "@/lib/pinecone/embed-store";
import { connectToDatabase } from "@/lib/mongodb/mongoose";
import { Library } from "@/lib/mongodb/models/Library";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 250,
  chunkOverlap: 30,
});

// Define function with CRON schedule - Daily at midnight IST
export const syncDocs = inngest.createFunction(
  { id: 'sync-docs-daily' },
  { cron: 'TZ=Asia/Kolkata 0 0 * * *' },
  async ({ step }) => {
    // Step 1: Query MongoDB for libraries that need syncing
    const librariesToSync = await step.run('fetch-libraries-needing-sync', async () => {
      await connectToDatabase();

      // Find libraries with needs_sync: true OR where llm_txt_url exists but not synced recently
      const libs = await Library.find({
        $or: [
          { needs_sync: true },
          { llm_txt_url: { $exists: true, $ne: null } }
        ],
        is_active: true
      }).limit(10); // Process 10 at a time to avoid timeout

      return libs.map(lib => ({
        slug: lib.slug,
        llm_txt_url: lib.llm_txt_url,
        _id: lib._id.toString()
      }));
    });

    if (!librariesToSync || librariesToSync.length === 0) {
      return { success: true, message: 'No libraries need syncing' };
    }

    // Step 2: Fan-out - send events for each library
    await step.run('fan-out', async () => {
      for (const lib of librariesToSync) {
        if (lib.llm_txt_url) {
          await inngest.send({
            name: 'docs/page.process',
            data: {
              url: lib.llm_txt_url,
              library: lib.slug,
              libraryId: lib._id
            }
          });
        }
      }
    });

    return {
      success: true,
      processed: librariesToSync.length,
      libraries: librariesToSync.map(l => l.slug)
    };
  }
);

// Process individual pages
export const processPage = inngest.createFunction(
  {
    id: 'process-page',
    concurrency: 10 // Process 10 at a time
  },
  { event: 'docs/page.process' },
  async ({ event, step }) => {
    const { url, library, libraryId } = event.data;

    // Each step is a separate execution
    const doc = await step.run('scrape', async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      return await response.text();
    });

    const chunks = await step.run('chunk', async () => {
      return await splitter.splitText(doc);
    });

    await step.run('embed', async () => {
      return await embedAndStore(chunks, library);
    });

    // Step 4: Update MongoDB - mark as synced
    await step.run('update-sync-status', async () => {
      await connectToDatabase();
      await Library.findByIdAndUpdate(libraryId, {
        needs_sync: false,
        last_synced_at: new Date(),
        total_docs: chunks.length
      });
    });

    return { url, library, success: true, chunks: chunks.length };
  }
);
