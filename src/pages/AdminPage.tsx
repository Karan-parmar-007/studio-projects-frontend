import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Shield,
  Radio,
  Cpu,
  Server,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Laptop,
  Smartphone,
  Terminal,
  Apple,
  Upload,
  Trash2,
  Download,
  AlertTriangle,
  FileCode,
  RefreshCw,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useAuth } from '@/components/Auth'
import { api, downloadUrl, type DownloadItem, type ModelLink, type Project } from '@/lib/api'
import { productIcon } from '@/lib/products'
import { useServices } from '@/lib/services'
import { isAppAdmin } from '@/lib/sso'

const PLATFORM_CONFIGS = [
  {
    platform: 'windows' as const,
    label: 'Windows Desktop Client',
    extBadge: '.exe',
    accept: '.exe',
    defaultFilename: 'StudioFlow.exe',
    icon: Laptop,
    desc: 'Native background dictation tray app for Windows 10/11.',
  },
  {
    platform: 'android' as const,
    label: 'Android Bubble App',
    extBadge: '.apk',
    accept: '.apk',
    defaultFilename: 'StudioFlow.apk',
    icon: Smartphone,
    desc: 'Floating dictation bubble for Android phones (APK).',
  },
  {
    platform: 'linux' as const,
    label: 'Linux Desktop Client',
    extBadge: 'StudioFlow',
    accept: '*/*',
    defaultFilename: 'StudioFlow',
    icon: Terminal,
    desc: 'Standalone Linux executable binary for Ubuntu, Debian, Arch.',
  },
  {
    platform: 'macos' as const,
    label: 'macOS Desktop Client',
    extBadge: '.dmg / .zip',
    accept: '.dmg,.zip,.pkg,application/octet-stream',
    defaultFilename: 'StudioFlow-macos.dmg',
    icon: Apple,
    desc: 'Universal macOS disk image or compressed archive.',
  },
]

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const linkMeta: Record<string, { title: string; desc: string; icon: typeof Cpu; hint: string }> = {
  'speech:local': {
    title: 'Local Speech Gateway (Tara CT2)',
    desc: 'Local PC faster-whisper service running on your RTX 3060 GPU.',
    icon: Radio,
    hint: 'Speech has no server fallback. Must point to your PC speech gateway tunnel.',
  },
  'llm:local': {
    title: 'Local LLM Gateway (Qwen 2.5 7B)',
    desc: 'Local Ollama service running on your RTX 3060 PC.',
    icon: Cpu,
    hint: 'Tried first. If online and enabled, text shaping executes on your PC.',
  },
  'llm:remote': {
    title: 'Remote LLM Gateway (VPS Qwen 2.5)',
    desc: 'Cloud/VPS Ollama gateway running on your secondary server.',
    icon: Server,
    hint: 'Automatic failover when your local PC is offline or queue is busy.',
  },
}

function ServiceSwitch({
  enabled,
  busy,
  onChange,
}: {
  enabled: boolean
  busy: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={busy}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onChange(!enabled)
      }}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
        enabled ? 'border-green/40 bg-green-tint text-green' : 'border-navy-border bg-navy text-slate'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${enabled ? 'bg-green' : 'bg-slate'}`} />
      {enabled ? 'On' : 'Off'}
    </button>
  )
}

export function AdminPage() {
  const { user, status } = useAuth()
  const catalog = useServices()
  const { projectSlug } = useParams<{ projectSlug?: string }>()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [links, setLinks] = useState<ModelLink[]>([])
  const [downloads, setDownloads] = useState<DownloadItem[] | null>(null)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState('')

  // Binary management state for the 4 platforms
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({})
  const [customFilenames, setCustomFilenames] = useState<Record<string, string>>({})
  const [customVersions, setCustomVersions] = useState<Record<string, string>>({})
  const [uploadingPlatform, setUploadingPlatform] = useState<string | null>(null)
  const [deletingPlatform, setDeletingPlatform] = useState<string | null>(null)
  const [confirmDeletePlatform, setConfirmDeletePlatform] = useState<string | null>(null)
  const [switchBusy, setSwitchBusy] = useState<string | null>(null)
  const [platformAlerts, setPlatformAlerts] = useState<
    Record<string, { type: 'success' | 'error'; text: string } | null>
  >({})

  const admin = isAppAdmin(user, 'studio')
  const userRole = user?.role_name || (user ? 'user' : 'guest')

  // Load project catalog
  useEffect(() => {
    if (admin) {
      api<Project[]>('/projects')
        .then(setProjects)
        .catch(() => setProjects([]))
    }
  }, [admin])

  const reloadDownloads = () => {
    return api<DownloadItem[]>('/downloads')
      .then((items) => setDownloads(items.filter((item) => item.product === 'whisperflow')))
      .catch(() => setDownloads([]))
  }

  // Load project links and downloads when viewing whisperflow
  useEffect(() => {
    if (!admin || (projectSlug !== 'whisperflow' && projectSlug !== 'llm')) return
    api<ModelLink[]>(`/${projectSlug}/links`)
      .then(setLinks)
      .catch((err: Error) => setError(err.message))
    if (projectSlug === 'whisperflow') void reloadDownloads()
  }, [admin, projectSlug])

  // Access Denied Screen for non-admins
  if (status !== 'loading' && !admin) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-light-navy/90 p-8 text-center shadow-2xl backdrop-blur-md space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Admin Access Required</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate">
                This console configures confidential model tunnels and release binaries. Access is restricted to accounts with <span className="font-mono text-green">owner</span>, <span className="font-mono text-green">super_admin</span>, or <span className="font-mono text-green">studio:admin</span> roles.
              </p>
            </div>

            <div className="rounded-xl border border-navy-border bg-navy/60 p-3 text-xs text-slate">
              <span>Your current SSO role: </span>
              <span className="font-bold text-amber-300 uppercase">{userRole}</span>
            </div>

            <div className="pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-xs font-semibold text-ink hover:bg-green/90 transition-all"
              >
                <span>Return to Dashboard →</span>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  function updateLink(id: string, patch: Partial<ModelLink>) {
    setLinks((current) =>
      current.map((link) => (link.id === id ? { ...link, ...patch } : link)),
    )
  }

  async function saveLink(link: ModelLink) {
    setError('')
    setSavedMessage('')
    setSavingId(link.id)
    try {
      const updated = await api<ModelLink>(`/${projectSlug}/links/${link.id}`, {
        method: 'PUT',
        body: JSON.stringify({ url: link.url, enabled: link.enabled }),
      })
      setLinks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setSavedMessage(`Saved ${link.role} (${link.placement}) tunnel. Settings verified on next request.`)
      window.setTimeout(() => setSavedMessage(''), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save tunnel URL')
    } finally {
      setSavingId(null)
    }
  }

  async function toggleService(slug: string, enabled: boolean) {
    setSwitchBusy(slug)
    setError('')
    try {
      const updated = await api<{ slug: string; enabled: boolean }>(`/admin/services/${slug}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
      })
      setProjects((current) =>
        current?.map((item) => (item.slug === slug ? { ...item, enabled: updated.enabled } : item)) ?? current,
      )
      catalog.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the service')
    } finally {
      setSwitchBusy(null)
    }
  }

  function handleFileSelect(platform: string, file: File) {
    setSelectedFiles((prev) => ({ ...prev, [platform]: file }))
    setCustomFilenames((prev) => ({ ...prev, [platform]: file.name }))
    const existing = (downloads ?? []).find((d) => d.platform === platform)
    if (!customVersions[platform]) {
      setCustomVersions((prev) => ({
        ...prev,
        [platform]: existing?.version || '1.0.0',
      }))
    }
    setPlatformAlerts((prev) => ({ ...prev, [platform]: null }))
  }

  async function handleUpload(platform: 'windows' | 'android' | 'linux' | 'macos') {
    const file = selectedFiles[platform]
    if (!file) return

    const conf = PLATFORM_CONFIGS.find((p) => p.platform === platform)
    const filename = customFilenames[platform]?.trim() || file.name || conf?.defaultFilename || `${platform}.bin`
    const version = customVersions[platform]?.trim() || '1.0.0'

    setUploadingPlatform(platform)
    setPlatformAlerts((prev) => ({ ...prev, [platform]: null }))

    try {
      const headers = new Headers()
      headers.set('X-Filename', filename)
      headers.set('X-Version', version)
      headers.set('Content-Type', file.type || 'application/octet-stream')

      await api<DownloadItem>(`/downloads/whisperflow/${platform}`, {
        method: 'PUT',
        headers,
        body: file,
      })

      setSelectedFiles((prev) => ({ ...prev, [platform]: null }))
      setPlatformAlerts((prev) => ({
        ...prev,
        [platform]: {
          type: 'success',
          text: `Successfully uploaded ${filename} (v${version}). Binary replaced in storage.`,
        },
      }))
      await reloadDownloads()
    } catch (err) {
      setPlatformAlerts((prev) => ({
        ...prev,
        [platform]: {
          type: 'error',
          text: err instanceof Error ? err.message : 'Upload failed',
        },
      }))
    } finally {
      setUploadingPlatform(null)
    }
  }

  async function handleDelete(platform: 'windows' | 'android' | 'linux' | 'macos') {
    setDeletingPlatform(platform)
    setPlatformAlerts((prev) => ({ ...prev, [platform]: null }))

    try {
      await api<void>(`/downloads/whisperflow/${platform}`, {
        method: 'DELETE',
      })

      setConfirmDeletePlatform(null)
      setSelectedFiles((prev) => ({ ...prev, [platform]: null }))
      setPlatformAlerts((prev) => ({
        ...prev,
        [platform]: {
          type: 'success',
          text: `Successfully purged ${platform} binary from storage.`,
        },
      }))
      await reloadDownloads()
    } catch (err) {
      setPlatformAlerts((prev) => ({
        ...prev,
        [platform]: {
          type: 'error',
          text: err instanceof Error ? err.message : 'Delete failed',
        },
      }))
    } finally {
      setDeletingPlatform(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header & Breadcrumbs */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-border pb-4">
            <div className="flex items-center gap-2 text-xs text-slate">
              <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
              <span>/</span>
              <Link to="/admin" className="hover:text-white">Admin</Link>
              {projectSlug && (
                <>
                  <span>/</span>
                  <span className="text-green font-semibold capitalize">{projectSlug}</span>
                </>
              )}
            </div>

            {/* Role Verification Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green-tint px-3 py-1 text-xs text-green">
              <Shield className="h-3.5 w-3.5 text-green" />
              <span>Role: <strong className="uppercase">{userRole}</strong> (Admin Verified)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {projectSlug
                  ? `${projectSlug === 'whisperflow' ? 'WhisperFlow' : projectSlug} Releases & Tunnels`
                  : 'Project Infrastructure & Secrets'}
              </h1>
              <p className="mt-1 text-sm text-slate">
                {projectSlug
                  ? 'Manage client binary packages and confidential model routing tunnels.'
                  : 'Select an AI service below to manage its releases, model links, and tunnels.'}
              </p>
            </div>

            {projectSlug && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-xl border border-navy-border bg-light-navy px-4 py-2 text-xs font-semibold text-white hover:border-green/40 hover:text-green transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Projects</span>
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedMessage && (
          <div className="rounded-2xl border border-green/30 bg-green-tint p-4 text-xs text-green flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{savedMessage}</span>
          </div>
        )}

        {/* VIEW 1: All Projects List */}
        {!projectSlug && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-navy-border pb-3">
              <h2 className="text-xl font-bold text-white">Configurable AI Services</h2>
              <span className="text-xs text-slate">Select a project to inspect tunnels</span>
            </div>

            <div className="grid gap-4">
              {(projects ?? []).map((project) => {
                const on = project.enabled !== false
                return (
                <div
                  key={project.slug}
                  className="rounded-3xl border border-navy-border bg-light-navy/60 p-6 sm:p-7"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Link to={`/admin/${project.slug}`} className="group flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-green/30 bg-green-tint text-green shadow-sm">
                        <ProductIcon slug={project.slug} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-white group-hover:text-green transition-colors">
                            {project.name}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              on
                                ? 'border border-green/30 bg-green-tint text-green'
                                : 'border border-navy-border bg-navy text-slate'
                            }`}
                          >
                            {on ? 'Live' : 'Off'}
                          </span>
                        </div>
                        <p className="text-xs text-slate mt-1">{project.description}</p>
                      </div>
                    </Link>

                    <ServiceSwitch
                      enabled={on}
                      busy={switchBusy === project.slug}
                      onChange={(next) => void toggleService(project.slug, next)}
                    />
                  </div>
                </div>
              )})}

              {projects === null && (
                <div className="rounded-3xl border border-navy-border bg-light-navy/40 p-12 text-center text-xs text-slate">
                  Loading project list…
                </div>
              )}
            </div>
          </div>
        )}

        {projectSlug && (
          <div className="flex flex-col gap-4 rounded-3xl border border-navy-border bg-light-navy/60 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Whole service</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate">
                One switch for this product. On means people can use it. Off means they see a note to contact you.
              </p>
            </div>
            <ServiceSwitch
              enabled={projects?.find((item) => item.slug === projectSlug)?.enabled !== false}
              busy={switchBusy === projectSlug}
              onChange={(next) => void toggleService(projectSlug, next)}
            />
          </div>
        )}

        {/* VIEW 2: Selected Project Secret Management: WhisperFlow */}
        {(projectSlug === 'whisperflow' || projectSlug === 'llm') && (
          <div className="space-y-12">
            {/* Section A: App Binaries & Releases */}
            {projectSlug === 'whisperflow' && <div className="space-y-6">
              <div className="border-b border-navy-border pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl font-bold text-white">Client Releases & Binaries</h2>
                      <span className="rounded-full border border-green/30 bg-green-tint px-2.5 py-0.5 text-xs font-semibold text-green">
                        4 Platforms
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate">
                      Upload installable binaries for Windows, Android, Linux, and macOS. Uploading a file replaces the active binary in object storage.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void reloadDownloads()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-navy-border bg-light-navy px-3.5 py-2 text-xs font-semibold text-white hover:border-green/40 hover:text-green transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-green" />
                    <span>Refresh Binaries</span>
                  </button>
                </div>
              </div>

              {/* 4 Platform Cards Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {PLATFORM_CONFIGS.map((conf) => {
                  const Icon = conf.icon
                  const activeDownload = (downloads ?? []).find(
                    (d) => d.platform === conf.platform,
                  )
                  const selectedFile = selectedFiles[conf.platform]
                  const isUploading = uploadingPlatform === conf.platform
                  const isDeleting = deletingPlatform === conf.platform
                  const isConfirmingDelete = confirmDeletePlatform === conf.platform
                  const alert = platformAlerts[conf.platform]
                  const currentVersion =
                    customVersions[conf.platform] ?? (activeDownload?.version || '1.0.0')
                  const currentFilename =
                    customFilenames[conf.platform] ??
                    (selectedFile?.name || activeDownload?.filename || conf.defaultFilename)

                  return (
                    <div
                      key={conf.platform}
                      className="rounded-3xl border border-navy-border bg-light-navy/60 p-6 space-y-5 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Platform Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-green/30 bg-green-tint text-green">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white">{conf.label}</h3>
                                <span className="rounded-md bg-navy px-2 py-0.5 font-mono text-[11px] text-light-slate border border-navy-border">
                                  {conf.extBadge}
                                </span>
                              </div>
                              <p className="text-xs text-slate mt-0.5">{conf.desc}</p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {activeDownload ? (
                            <span className="inline-flex items-center gap-1 shrink-0 rounded-full border border-green/30 bg-green-tint px-2.5 py-1 text-xs font-semibold text-green">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>v{activeDownload.version || '1.0'}</span>
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full border border-navy-border bg-navy px-2.5 py-1 text-xs text-slate">
                              No binary
                            </span>
                          )}
                        </div>

                        {/* Active Binary Info Box */}
                        {activeDownload && (
                          <div className="rounded-2xl border border-navy-border bg-navy/60 p-4 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate">Current File:</span>
                              <span className="font-mono font-semibold text-white">
                                {activeDownload.filename}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate">Binary Size:</span>
                              <span className="font-mono text-green font-semibold">
                                {formatBytes(activeDownload.size)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate">Version:</span>
                              <span className="font-mono text-white">
                                {activeDownload.version || 'none'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate">Last Deployed:</span>
                              <span className="text-slate">
                                {new Date(activeDownload.updated_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Actions Row */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-navy-border/60">
                              <a
                                href={downloadUrl('whisperflow', conf.platform)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-navy-border bg-light-navy px-3 py-1.5 text-xs font-semibold text-white hover:border-green/40 hover:text-green transition-all"
                              >
                                <Download className="h-3.5 w-3.5 text-green" />
                                <span>Test Download</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => setConfirmDeletePlatform(conf.platform)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Binary</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Delete Confirmation Dialog */}
                        {isConfirmingDelete && (
                          <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 space-y-3">
                            <div className="flex items-start gap-2.5 text-xs text-red-300">
                              <AlertTriangle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-bold text-white">Confirm Binary Deletion</p>
                                <p className="leading-relaxed">
                                  Deleting will immediately remove this file from object storage and users will no longer be able to download it.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setConfirmDeletePlatform(null)}
                                disabled={isDeleting}
                                className="rounded-xl border border-navy-border bg-navy px-3.5 py-1.5 text-xs text-slate hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(conf.platform)}
                                disabled={isDeleting}
                                className="rounded-xl bg-red-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                              >
                                {isDeleting ? 'Deleting…' : 'Yes, Delete Binary'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Upload / Replace Box */}
                        <div className="space-y-3 pt-1">
                          <span className="text-xs font-bold text-white">
                            {activeDownload ? 'Upload New Version (Replace Old)' : 'Upload Initial Release'}
                          </span>

                          {!selectedFile ? (
                            <label
                              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy-border bg-navy/40 p-5 cursor-pointer hover:border-green/50 hover:bg-navy/70 transition-all text-center"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault()
                                const f = e.dataTransfer.files?.[0]
                                if (f) handleFileSelect(conf.platform, f)
                              }}
                            >
                              <Upload className="h-6 w-6 text-green mb-1.5" />
                              <span className="text-xs font-semibold text-white">
                                Select <strong className="text-green font-mono">{conf.extBadge}</strong> binary
                              </span>
                              <span className="text-[11px] text-slate mt-0.5">Click or drag file here</span>
                              <input
                                type="file"
                                accept={conf.accept}
                                onChange={(e) => {
                                  const f = e.target.files?.[0]
                                  if (f) handleFileSelect(conf.platform, f)
                                }}
                                className="sr-only"
                              />
                            </label>
                          ) : (
                            <div className="space-y-3 rounded-2xl border border-green/30 bg-green-tint/20 p-4">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <FileCode className="h-4 w-4 text-green" />
                                  <span className="font-semibold text-white truncate max-w-[180px]">
                                    {selectedFile.name}
                                  </span>
                                </div>
                                <span className="font-mono text-xs text-slate">
                                  {formatBytes(selectedFile.size)}
                                </span>
                              </div>

                              <div className="grid gap-2 sm:grid-cols-2">
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-slate mb-1">
                                    Version String
                                  </label>
                                  <input
                                    value={currentVersion}
                                    onChange={(e) =>
                                      setCustomVersions((prev) => ({
                                        ...prev,
                                        [conf.platform]: e.target.value,
                                      }))
                                    }
                                    placeholder="e.g. 1.0.1"
                                    className="w-full rounded-xl border border-navy-border bg-navy px-3 py-1.5 text-xs text-white outline-none focus:border-green"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-slate mb-1">
                                    Saved Filename
                                  </label>
                                  <input
                                    value={currentFilename}
                                    onChange={(e) =>
                                      setCustomFilenames((prev) => ({
                                        ...prev,
                                        [conf.platform]: e.target.value,
                                      }))
                                    }
                                    placeholder={conf.defaultFilename}
                                    className="w-full rounded-xl border border-navy-border bg-navy px-3 py-1.5 text-xs text-white outline-none focus:border-green"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedFiles((prev) => ({
                                      ...prev,
                                      [conf.platform]: null,
                                    }))
                                  }
                                  disabled={isUploading}
                                  className="rounded-xl border border-navy-border bg-navy px-3.5 py-1.5 text-xs text-slate hover:text-white"
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  onClick={() => void handleUpload(conf.platform)}
                                  disabled={isUploading}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-green px-4 py-1.5 text-xs font-semibold text-ink hover:bg-green/90 disabled:opacity-50 transition-all shadow-sm"
                                >
                                  <Upload className="h-3.5 w-3.5" />
                                  <span>{isUploading ? 'Uploading…' : 'Upload & Deploy'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Per-Platform Alerts */}
                        {alert && (
                          <div
                            className={`rounded-2xl border p-3.5 text-xs flex items-center gap-2.5 ${
                              alert.type === 'error'
                                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                : 'border-green/30 bg-green-tint text-green font-medium'
                            }`}
                          >
                            {alert.type === 'error' ? (
                              <AlertCircle className="h-4 w-4 shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                            )}
                            <span>{alert.text}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>}

            {/* Section B: Gateway Tunnels */}
            <div className="space-y-6 pt-6 border-t border-navy-border">
              <div className="border-b border-navy-border pb-4">
                <h2 className="text-2xl font-bold text-white">
                  {projectSlug === 'llm' ? 'Oracle LLM' : 'WhisperFlow Gateway Tunnels'}
                </h2>
                <p className="text-xs text-slate mt-1">
                  {projectSlug === 'llm'
                    ? 'Every chat and cleanup request goes to this Oracle server. There is no local link.'
                    : 'Speech stays on the faster local link. The language model can fall over to the second server.'}
                </p>
              </div>

              <div className="grid gap-6">
                {(projectSlug === 'llm' ? links.filter((link) => link.placement === 'remote') : links).map((link) => {
                  const meta = (projectSlug === 'llm'
                    ? {
                        title: 'Oracle LLM server',
                        desc: 'Streaming chat and cleanup. Requests are not sent to the PC.',
                        icon: Server,
                        hint: 'This is the only address the LLM product calls.',
                      }
                    : linkMeta[`${link.role}:${link.placement}`]) || {
                    title: `${link.role} · ${link.placement}`,
                    desc: 'Model service link',
                    icon: Cpu,
                    hint: '',
                  }
                  const Icon = meta.icon
                  const isSaving = savingId === link.id

                  return (
                    <form
                      key={link.id}
                      onSubmit={(e) => {
                        e.preventDefault()
                        void saveLink(link)
                      }}
                      className="rounded-3xl border border-navy-border bg-light-navy/60 p-6 sm:p-7 space-y-4 transition-all hover:border-navy-border/90"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-green/30 bg-green-tint text-green">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 className="text-base font-bold text-white">{meta.title}</h3>
                              <span className="rounded-md bg-navy px-2 py-0.5 font-mono text-[11px] text-green border border-navy-border">
                                {link.role}:{link.placement}
                              </span>
                            </div>
                            <p className="text-xs text-slate mt-0.5">{meta.desc}</p>
                          </div>
                        </div>

                        {/* Enable / Disable Toggle Switch */}
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <span className="text-xs font-semibold text-white">
                            {link.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <div className="relative inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={link.enabled}
                              onChange={(e) => updateLink(link.id, { enabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-navy border border-navy-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green" />
                          </div>
                        </label>
                      </div>

                      {/* URL Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white">Tunnel Endpoint URL</label>
                        <input
                          value={link.url}
                          onChange={(e) => updateLink(link.id, { url: e.target.value })}
                          placeholder="https://..."
                          className="w-full rounded-xl border border-navy-border bg-navy px-4 py-2.5 font-mono text-xs text-white outline-none focus:border-green"
                        />
                      </div>

                      {meta.hint && (
                        <p className="text-xs text-slate/80 leading-relaxed">{meta.hint}</p>
                      )}

                      <div className="flex items-center justify-end pt-2">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2 text-xs font-semibold text-ink hover:bg-green/90 disabled:opacity-50 transition-all shadow-sm"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>{isSaving ? 'Saving…' : 'Save Tunnel'}</span>
                        </button>
                      </div>
                    </form>
                  )
                })}

                {links.length === 0 && !error && (
                  <div className="rounded-3xl border border-navy-border bg-light-navy/40 p-12 text-center text-xs text-slate">
                    Loading model routing tunnels…
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: A future product still gets the service switch above. */}
        {projectSlug === 'gmaps' && (
          <div className="rounded-3xl border border-navy-border bg-light-navy/40 p-6 sm:p-8 space-y-2">
            <h3 className="text-base font-bold text-white">Maps Scraper</h3>
            <p className="text-xs leading-relaxed text-slate">
              No model links: it calls Google Maps from this server. 50 companies per user per day, at most 2 searches at once.
              Turning the switch off stops every running search right away and gives the unused companies back.
            </p>
          </div>
        )}

        {projectSlug && projectSlug !== 'whisperflow' && projectSlug !== 'llm' && projectSlug !== 'gmaps' && (
          <div className="rounded-3xl border border-navy-border bg-light-navy/40 p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-navy-border bg-navy text-slate">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-white capitalize">{projectSlug} Service</h3>
            <p className="text-xs text-slate max-w-md mx-auto leading-relaxed">
              This service is currently in development. Model gateway endpoints, tunnels, and tokens will be configurable here when this product goes live.
            </p>
            <div className="pt-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-xl border border-navy-border px-5 py-2.5 text-xs font-semibold text-white hover:border-green/40 hover:text-green"
              >
                <span>← Back to All Projects</span>
              </Link>
            </div>
          </div>
        )}

        {/* Security & Role Enforcement Box */}
        <section className="rounded-3xl border border-navy-border bg-light-navy/40 p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-green" />
            <h3 className="font-bold text-white text-base">Role-Enforced Tunnel Security</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate">
            Tunnel endpoints are strictly contacted server-to-server by the Studio backend using private <code className="text-white font-mono text-xs">X-Flow-Token</code> authentication headers. Secret endpoints are never exposed directly to clients or public web traffic.
          </p>
        </section>
      </div>
    </DashboardLayout>
  )
}

function ProductIcon({ slug }: { slug: string }) {
  const Icon = productIcon(slug)
  return <Icon className="h-6 w-6" />
}
