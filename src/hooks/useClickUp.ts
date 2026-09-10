import { useEffect, useState } from 'react'
import { clientSessionStore } from '../storage'

interface CallOptions {
  method?: string
  body?: Record<string, any>
  query?: Record<string, any>
}

const call = async (path: string, { method = 'GET', body, query }: CallOptions = {}): Promise<any> => {
  const token = clientSessionStore.getToken()
  const res = await fetch('/api/clickup-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ method, path, body, query })
  })
  return res.json()
}

export interface ClickUpList {
  id: string
  name: string
  [key: string]: any
}

export interface ClickUpTask {
  id: string
  name: string
  description?: string
  status?: { status: string; orderindex: number }
  priority?: { id: number; priority: string }
  due_date?: string
  [key: string]: any
}

export interface ClickUpComment {
  id: string
  comment_text?: string
  date?: string
  attachments?: Array<{ url?: string; title?: string }>
  [key: string]: any
}

export function useClickUpLists(folderId: string | null | undefined) {
  const [lists, setLists] = useState<ClickUpList[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLists = () => {
    if (!folderId) return
    setLoading(true)
    call(`/folder/${folderId}/list`)
      .then((d: any) => setLists(d.lists || []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(fetchLists, [folderId])
  return { lists, loading, error, refresh: fetchLists }
}

interface UseClickUpTasksOptions {
  pollingInterval?: number
  enablePolling?: boolean
}

export function useClickUpTasks(listId: string | null | undefined, options: UseClickUpTasksOptions = {}) {
  const { pollingInterval = 30000, enablePolling = true } = options
  const [tasks, setTasks] = useState<ClickUpTask[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchTasks = (silent = false) => {
    if (!listId) return
    if (!silent) setLoading(true)
    call(`/list/${listId}/task`, { query: { include_closed: true, subtasks: true } })
      .then((d: any) => {
        setTasks(d.tasks || [])
        setLastUpdated(new Date())
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTasks()
  }, [listId])

  useEffect(() => {
    if (!listId || !enablePolling) return
    const interval = setInterval(() => {
      fetchTasks(true)
    }, pollingInterval)
    return () => clearInterval(interval)
  }, [listId, pollingInterval, enablePolling])

  return { tasks, loading, error, lastUpdated, refresh: () => fetchTasks(false) }
}

interface UseClickUpCommentsOptions {
  pollingInterval?: number
  enablePolling?: boolean
}

export function useClickUpComments(taskId: string | null | undefined, options: UseClickUpCommentsOptions = {}) {
  const { pollingInterval = 15000, enablePolling = true } = options
  const [comments, setComments] = useState<ClickUpComment[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchComments = (silent = false) => {
    if (!taskId) return
    if (!silent) setLoading(true)
    call(`/task/${taskId}/comment`)
      .then((d: any) => {
        setComments(d.comments || [])
        setLastUpdated(new Date())
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchComments()
  }, [taskId])

  useEffect(() => {
    if (!taskId || !enablePolling) return
    const interval = setInterval(() => {
      fetchComments(true)
    }, pollingInterval)
    return () => clearInterval(interval)
  }, [taskId, pollingInterval, enablePolling])

  const postComment = async (text: string): Promise<void> => {
    await call(`/task/${taskId}/comment`, { method: 'POST', body: { comment_text: text } })
    fetchComments()
  }

  const postAttachment = async (file: File): Promise<void> => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    await call(`/task/${taskId}/attachment`, {
      method: 'POST',
      body: { base64, filename: file.name, mimeType: file.type }
    })
    fetchComments()
  }

  return { comments, loading, error, lastUpdated, refresh: () => fetchComments(false), postComment, postAttachment }
}
