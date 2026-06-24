'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'

type Source = { title: string; url: string; source: string; excerpt: string }
type Message = { role: 'user' | 'assistant'; content: string; sources?: Source[] }

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'yc', label: 'YC Videos' },
  { value: 'paul-graham', label: 'PG Essays' },
  { value: 'starter-story', label: 'Starter Story' },
]

const SOURCE_BADGE: Record<string, string> = {
  'paul-graham': 'PG',
  'yc': 'YC',
  'starter-story': 'SS',
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [source, setSource] = useState('all')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', content: question }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, source })
      })
      const data = await res.json()

      if (data.error) {
        setMessages(m => [...m, { role: 'assistant', content: `Error: ${data.error}` }])
      } else {
        setMessages(m => [...m, {
          role: 'assistant',
          content: data.answer ?? '**Top matches from corpus:**',
          sources: data.sources
        }])
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>Distribution Playbook</h1>
        <p>Ask anything about SaaS distribution — answers from 1,293 essays & founder interviews</p>
      </header>

      <div className={styles.sourceBar}>
        {SOURCE_OPTIONS.map(o => (
          <button
            key={o.value}
            className={`${styles.sourceBtn} ${source === o.value ? styles.active : ''}`}
            onClick={() => setSource(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className={styles.chat}>
        {messages.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.suggestions}>
              {[
                'How did founders use Reddit to get first 1000 users?',
                'What pricing strategies work for B2B SaaS early stage?',
                'How to do SEO content marketing for a new product?',
                'What does Paul Graham say about doing things that don\'t scale?',
              ].map(s => (
                <button key={s} className={styles.suggestion} onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`${styles.message} ${styles[m.role]}`}>
            {m.role === 'assistant' && (
              <div className={styles.avatar}>AI</div>
            )}
            <div className={styles.bubble}>
              <p>{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <div className={styles.sources}>
                  <p className={styles.sourcesLabel}>Sources</p>
                  {m.sources.map((s, j) => (
                    <a key={j} href={s.url} target="_blank" rel="noopener" className={styles.sourceCard}>
                      <span className={`${styles.badge} ${styles[s.source?.replace('-','')]}`}>
                        {SOURCE_BADGE[s.source] ?? s.source}
                      </span>
                      <span className={styles.sourceTitle}>{s.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.avatar}>AI</div>
            <div className={styles.bubble}>
              <div className={styles.typing}><span/><span/><span/></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about distribution, SEO, pricing, Reddit, cold email..."
          disabled={loading}
        />
        <button className={styles.sendBtn} onClick={send} disabled={loading || !input.trim()}>
          {loading ? '...' : '→'}
        </button>
      </div>
    </main>
  )
}
