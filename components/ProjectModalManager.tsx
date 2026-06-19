"use client"

import { useState, useEffect } from 'react'
import CreateProjectModal from './CreateProjectModal'
import RenameProjectModal from './RenameProjectModal'
import DeleteProjectModal from './DeleteProjectModal'

type Project = {
  id: string
  organization_id: string
  name: string
  description?: string | null
  created_at?: string
}

export default function ProjectModalManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createOrgId, setCreateOrgId] = useState<string | null>(null)

  const [projectToRename, setProjectToRename] = useState<Project | null>(null)
  const [renameOrgId, setRenameOrgId] = useState<string | null>(null)

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null)

  useEffect(() => {
    const handleCreateEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      setCreateOrgId(customEvent.detail?.orgId || null)
      setIsCreateOpen(true)
    }

    const handleRenameEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      setProjectToRename(customEvent.detail?.project || null)
      setRenameOrgId(customEvent.detail?.orgId || null)
    }

    const handleDeleteEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      setProjectToDelete(customEvent.detail?.project || null)
      setDeleteOrgId(customEvent.detail?.orgId || null)
    }

    window.addEventListener('open-create-project-modal', handleCreateEvent)
    window.addEventListener('open-rename-project-modal', handleRenameEvent)
    window.addEventListener('open-delete-project-modal', handleDeleteEvent)

    return () => {
      window.removeEventListener('open-create-project-modal', handleCreateEvent)
      window.removeEventListener('open-rename-project-modal', handleRenameEvent)
      window.removeEventListener('open-delete-project-modal', handleDeleteEvent)
    }
  }, [])

  const notifyRefresh = () => {
    window.dispatchEvent(new Event('refresh-projects'))
  }

  return (
    <>
      {isCreateOpen && createOrgId && (
        <CreateProjectModal
          orgId={createOrgId}
          onClose={() => {
            setIsCreateOpen(false)
            setCreateOrgId(null)
          }}
          onCreated={notifyRefresh}
        />
      )}

      {projectToRename && renameOrgId && (
        <RenameProjectModal
          project={projectToRename}
          orgId={renameOrgId}
          onClose={() => {
            setProjectToRename(null)
            setRenameOrgId(null)
          }}
          onRenamed={notifyRefresh}
        />
      )}

      {projectToDelete && deleteOrgId && (
        <DeleteProjectModal
          project={projectToDelete}
          orgId={deleteOrgId}
          onClose={() => {
            setProjectToDelete(null)
            setDeleteOrgId(null)
          }}
          onDeleted={notifyRefresh}
        />
      )}
    </>
  )
}
