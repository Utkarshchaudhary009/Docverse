// app/api/inngest/route.js
import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { syncDocs, processPage } from '@/inngest/functions/sync-docs'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncDocs,      // Has cron schedule
    processPage    // Triggered by events
  ]
})

export const maxDuration = 60 // Hobby plan limit
