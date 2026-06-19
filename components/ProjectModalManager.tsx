"use client"

import { useState, useEffect } from 'react'
import CreateProjectModal from './CreateProjectModal'
import RenameProjectModal from './RenameProjectModal'
import DeleteProjectModal from './DeleteProjectModal'
import EditSprintModal from './EditSprintModal'
import DeleteSprintModal from './DeleteSprintModal'

type Project = {
  id: string
  organization_id: string
  name: string
  description?: string | null
  created_at?: string
}

type Sprint = {
  id: number
  name: string
  goal: string | null
  start_date: string
  end_date: string
  organization_id: string
}

export default function ProjectModalManager() {
  // Project states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createOrgId, setCreateOrgId] = useState<string | null>(null)

  const [projectToRename, setProjectToRename] = useState<Project | null>(null)
  const [renameOrgId, setRenameOrgId] = useState<string | null>(null)

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null)

  // Sprint states
  const [sprintToEdit, setSprintToEdit] = useState<Sprint | null>(null)
  const [editSprintProjectId, setEditSprintProjectId] = useState<string | null>(null)

  const [sprintToDelete, setSprintToDelete] = useState<Sprint | null>(null)
  const [deleteSprintProjectId, setDeleteSprintProjectId] = useState<string | null>(null)

  useEffect(() => {
    // Project event handlers
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

    // Sprint event handlers
    const handleEditSprintEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      setSprintToEdit(customEvent.detail?.sprint || null)
      setEditSprintProjectId(customEvent.detail?.projectId || null)
    }

    const handleDeleteSprintEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      setSprintToDelete(customEvent.detail?.sprint || null)
      setDeleteSprintProjectId(customEvent.detail?.projectId || null)
    }

    window.addEventListener('open-create-project-modal', handleCreateEvent)
    window.addEventListener('open-rename-project-modal', handleRenameEvent)
    window.addEventListener('open-delete-project-modal', handleDeleteEvent)
    window.addEventListener('open-edit-sprint-modal', handleEditSprintEvent)
    window.addEventListener('open-delete-sprint-modal', handleDeleteSprintEvent)

    return () => {
      window.removeEventListener('open-create-project-modal', handleCreateEvent)
      window.removeEventListener('open-rename-project-modal', handleRenameEvent)
      window.removeEventListener('open-delete-project-modal', handleDeleteEvent)
      window.removeEventListener('open-edit-sprint-modal', handleEditSprintEvent)
      window.removeEventListener('open-delete-sprint-modal', handleDeleteSprintEvent)
    }
  }, [])

  const notifyProjectRefresh = () => {
    window.dispatchEvent(new Event('refresh-projects'))
  }

  const notifySprintRefresh = () => {
    window.dispatchEvent(new Event('refresh-sprints'))
  }

  return (
    <>
      {/* Project Modals */}
      {isCreateOpen && createOrgId && (
        <CreateProjectModal
          orgId={createOrgId}
          onClose={() => {
            setIsCreateOpen(false)
            setCreateOrgId(null)
          }}
          onCreated={notifyProjectRefresh}
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
          onRenamed={notifyProjectRefresh}
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
          onDeleted={notifyProjectRefresh}
        />
      )}

      {/* Sprint Modals */}
      {sprintToEdit && editSprintProjectId && (
        <EditSprintModal
          sprint={sprintToEdit}
          projectId={editSprintProjectId}
          onClose={() => {
            setSprintToEdit(null)
            setEditSprintProjectId(null)
          }}
          onSaved={notifySprintRefresh}
        />
      )}

      {sprintToDelete && deleteSprintProjectId && (
        <DeleteSprintModal
          sprint={sprintToDelete}
          projectId={deleteSprintProjectId}
          onClose={() => {
            setSprintToDelete(null)
            setDeleteSprintProjectId(null)
          }}
          onDeleted={notifySprintRefresh}
        />
      )}
    </>
  )
}
