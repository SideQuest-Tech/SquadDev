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

export function useClickUpTasks(listId) {
  const [tasks, setTasks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = () => {
    if (!listId) return
    setLoading(true)
    call(`/list/${listId}/task`, { query: { include_closed: true, subtasks: true } })
      .then(d => setTasks(d.tasks || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(fetch, [listId])
  return { tasks, loading, error, refresh: fetch }
}

export function useClickUpComments(taskId) {
  const [comments, setComments] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = () => {
    if (!taskId) return
    setLoading(true)
    call(`/task/${taskId}/comment`)
      .then(d => setComments(d.comments || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(fetch, [taskId])

  const postComment = async (text) => {
    await call(`/task/${taskId}/comment`, { method: 'POST', body: { comment_text: text } })
    fetch()
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
    fetch()
  }

  return { comments, loading, error, refresh: fetch, postComment, postAttachment }
}
