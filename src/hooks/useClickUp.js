import { useEffect, useState } from 'react'
import { clientSessionStore } from '../storage'

const call = async (path, { method = 'GET', body, query } = {}) => {
  const token = clientSessionStore.getToken()
  const res = await fetch('/api/clickup-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ method, path, body, query })
  })
  return res.json()
}

export function useClickUpLists(folderId) {
  const [lists, setLists] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = () => {
    if (!folderId) return
    setLoading(true)
    call(`/folder/${folderId}/list`)
      .then(d => setLists(d.lists || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(fetch, [folderId])
  return { lists, loading, error, refresh: fetch }
}

export function useClickUpTasks(listId, options = {}) {
  const { pollingInterval = 30000, enablePolling = true } = options // Default: poll every 30 seconds
  const [tasks, setTasks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetch = (silent = false) => {
    if (!listId) return
    if (!silent) setLoading(true)
    call(`/list/${listId}/task`, { query: { include_closed: true, subtasks: true } })
      .then(d => {
        setTasks(d.tasks || [])
        setLastUpdated(new Date())
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  // Initial fetch
  useEffect(() => {
    fetch()
  }, [listId])

  // Auto-refresh polling
  useEffect(() => {
    if (!listId || !enablePolling) return

    const interval = setInterval(() => {
      fetch(true) // Silent refresh (don't show loading state)
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [listId, pollingInterval, enablePolling])

  return { tasks, loading, error, lastUpdated, refresh: () => fetch(false) }
}

export function useClickUpComments(taskId, options = {}) {
  const { pollingInterval = 15000, enablePolling = true } = options // Poll every 15 seconds for comments
  const [comments, setComments] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetch = (silent = false) => {
    if (!taskId) return
    if (!silent) setLoading(true)
    call(`/task/${taskId}/comment`)
      .then(d => {
        setComments(d.comments || [])
        setLastUpdated(new Date())
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  // Initial fetch
  useEffect(() => {
    fetch()
  }, [taskId])

  // Auto-refresh polling for comments
  useEffect(() => {
    if (!taskId || !enablePolling) return

    const interval = setInterval(() => {
      fetch(true) // Silent refresh
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [taskId, pollingInterval, enablePolling])

  const postComment = async (text) => {
    await call(`/task/${taskId}/comment`, { method: 'POST', body: { comment_text: text } })
    fetch() // Refresh immediately after posting
  }

  const postAttachment = async (file) => {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    await call(`/task/${taskId}/attachment`, {
      method: 'POST',
      body: { base64, filename: file.name, mimeType: file.type }
    })
    fetch() // Refresh immediately after uploading
  }

  return { comments, loading, error, lastUpdated, refresh: () => fetch(false), postComment, postAttachment }
}
