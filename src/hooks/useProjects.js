import { useEffect, useState } from 'react'
import { projectStore } from '../storage'

// Live view of the project store. Re-reads whenever this tab saves or another tab changes it.
export function useProjects() {
  const [projects, setProjects] = useState(projectStore.get)
  useEffect(() => projectStore.subscribe(() => setProjects(projectStore.get())), [])
  return projects
}

export function useProject(id) {
  const projects = useProjects()
  return projects.find(project => project.id === id) || null
}
