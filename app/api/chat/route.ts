import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { question, source } = await req.json()

  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question required' }, { status: 400 })
  }

  // Step 1: Retrieve relevant chunks from Supabase FTS
  const q = question.trim().replace(/\s+/g, '+')
  let query = supabase
    .from('distribution_docs')
    .select('title, url, text, source')
    .textSearch('fts', q, { type: 'websearch', config: 'english' })
    .limit(10)

  if (source && source !== 'all') {
    query = query.eq('source', source)
  }

  const { data: chunks, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!chunks || chunks.length === 0) {
    return NextResponse.json({
      answer: "I couldn't find relevant content for that question. Try rephrasing or using different keywords.",
      sources: []
    })
  }

  // Step 2: Synthesize with OpenAI
  if (!process.env.OPENAI_API_KEY) {
    // No key yet — return raw results
    return NextResponse.json({
      answer: null,
      sources: chunks.map(c => ({
        title: c.title,
        url: c.url,
        source: c.source,
        excerpt: c.text.slice(0, 400)
      }))
    })
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const context = chunks.map((c, i) =>
    `[${i + 1}] ${sourceLabel(c.source)} — "${c.title}"\nURL: ${c.url}\n${c.text.slice(0, 800)}`
  ).join('\n\n---\n\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a distribution advisor for SaaS founders. Answer questions using ONLY the provided excerpts from Paul Graham essays, YC videos, and Starter Story interviews. Be specific and tactical. Always cite sources as [1], [2] etc. If the excerpts don't contain a good answer, say so honestly.`
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nExcerpts:\n\n${context}`
      }
    ],
    temperature: 0.3,
    max_tokens: 800
  })

  return NextResponse.json({
    answer: completion.choices[0].message.content,
    sources: chunks.map(c => ({
      title: c.title,
      url: c.url,
      source: c.source,
      excerpt: c.text.slice(0, 300)
    }))
  })
}

function sourceLabel(s: string) {
  return { 'paul-graham': 'PG Essay', 'yc': 'YC Video', 'starter-story': 'Starter Story' }[s] ?? s
}
