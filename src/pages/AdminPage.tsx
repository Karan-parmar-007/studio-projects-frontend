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
  ArrowRight,
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
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useAuth } from '@/components/Auth'
import { api, downloadUrl, type DownloadItem, type ModelLink, type Project } from '@/lib/api'
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
    label: 'Android Custom Keyboard',
    extBadge: '.apk',
    accept: '.apk',
    defaultFilename: 'StudioFlow.apk',
    icon: Smartphone,
    desc: 'Custom IME dictation keyboard package for Android devices.',
  },
  {
    platform: 'linux' as const,
    label: 'Linux Desktop Client',
    extBadge: '.zip / bin',
    accept: '.zip,.tar.gz,.deb,.AppImage,*',
    defaultFilename: 'StudioFlow-desktop.zip',
    icon: Terminal,
    desc: 'Background daemon package or binary bundle for Linux.',
  },
  {
    platform: 'macos' as const,
    label: 'macOS Desktop Client',
    extBadge: '.dmg / .zip',
    accept: '.dmg,.zip,.pkg,*',
    defaultFilename: 'StudioFlow-macos.dmg',
    icon: Apple,
    desc: 'Universal application bundle or disk image for macOS.',
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
    hint: 'Tried first. If online and enabled, formatting executes on your PC.',
  },
  'llm:remote': {
    title: 'Remote LLM Gateway (VPS Qwen 2.5)',
    desc: 'Cloud/VPS Ollama gateway running on your secondary server.',
    icon: Server,
    hint: 'Automatic fallback when your local PC is offline or busy.',
  },
}

export function AdminPage() {
  const { user, status } = useAuth()
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
    if (admin && projectSlug === 'whisperflow') {
      api<ModelLink[]>('/whisperflow/links')
        .then(setLinks)
        .catch((err: Error) => setError(err.message))

      void reloadDownloads()
    }
  }, [admin, projectSlug])

  // Access Denied Screen for non-admins
  if (status !== 'loading' && !admin) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#ff8b8b]/30 bg-light-navy/90 p-8 text-center shadow-2xl backdrop-blur-md space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ff8b8b]/30 bg-[#ff8b8b]/10 text-[#ff8b8b]">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-lightest-slate">Admin Access Required</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate">
                This section manages confidential infrastructure secrets and model routing tunnels. Access is strictly restricted to accounts with <span className="font-mono text-green">owner</span>, <span className="font-mono text-green">super_admin</span>, or <span className="font-mono text-green">studio:admin</span> roles.
              </p>
            </div>

            <div className="rounded-xl border border-navy-border bg-navy/60 p-3 font-mono text-xs text-slate">
              <span>Your current SSO role: </span>
              <span className="font-semibold text-amber-300">{userRole}</span>
            </div>

            <div className="pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 font-mono text-xs font-semibold text-navy hover:bg-green/90 transition-all"
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
      const updated = await api<ModelLink>(`/whisperflow/links/${link.id}`, {
        method: 'PUT',
        body: JSON.stringify({ url: link.url, enabled: link.enabled }),
      })
      setLinks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setSavedMessage(`Saved ${link.role} (${link.placement}). Gateway verified on next call.`)
      window.setTimeout(() => setSavedMessage(''), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save link')
    } finally {
      setSavingId(null)
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
          text: `Successfully uploaded ${filename} (${version}). Previous version replaced.`,
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
          text: `Successfully deleted ${platform} binary. File purged from storage.`,
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
      <div className="space-y-10 max-w-4xl">
        {/* Breadcrumb & Navigation */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-border/60 pb-3">
            <div className="flex items-center gap-2 font-mono text-xs text-slate">
              <Link to="/dashboard" className="hover:text-green">Dashboard</Link>
              <span>/</span>
              <Link to="/admin" className="hover:text-green">Admin Settings</Link>
              {projectSlug && (
                <>
                  <span>/</span>
                  <span className="text-green font-medium capitalize">{projectSlug}</span>
                </>
              )}
            </div>

            {/* Role Verification Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green-tint px-3 py-1 font-mono text-[11px] text-green">
              <Shield className="h-3 w-3 text-green" />
              <span>Role: <strong className="font-semibold uppercase">{userRole}</strong> (Admin Verified)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-lightest-slate sm:text-4xl">
                {projectSlug ? `${projectSlug === 'whisperflow' ? 'WhisperFlow' : projectSlug} Releases & Infrastructure` : 'Project Releases & Infrastructure'}
              </h1>
              <p className="mt-1 text-sm text-slate">
                {projectSlug
                  ? 'Manage client binary releases, download packages, and confidential model routing tunnels.'
                  : 'Select a project below to inspect and configure its releases, model links, and secrets.'}
              </p>
            </div>

            {projectSlug && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-xl border border-navy-border bg-light-navy/60 px-4 py-2 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Projects</span>
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#ff8b8b]/30 bg-[#ff8b8b]/10 p-4 text-xs text-[#ff8b8b] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedMessage && (
          <div className="rounded-xl border border-green/30 bg-green-tint p-4 text-xs text-green flex items-center gap-2 font-mono">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{savedMessage}</span>
          </div>
        )}

        {/* VIEW 1: All Projects List (When no projectSlug is selected) */}
        {!projectSlug && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-navy-border/60 pb-3">
              <h2 className="text-lg font-bold text-lightest-slate">Projects with Configurable Secrets</h2>
              <span className="font-mono text-xs text-slate">Click a project to manage secrets</span>
            </div>

            <div className="grid gap-4">
              {(projects ?? []).map((project) => (
                <Link
                  key={project.slug}
                  to={`/admin/${project.slug}`}
                  className="group rounded-2xl border border-navy-border bg-light-navy/50 p-6 transition-all duration-200 hover:border-green/40 hover:bg-light-navy/80 hover:shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-green/30 bg-green-tint text-green">
                        {project.slug === 'whisperflow' ? <Radio className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-xl font-bold text-lightest-slate group-hover:text-green transition-colors">
                            {project.name}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                              project.status === 'live'
                                ? 'border border-green/30 bg-green-tint text-green'
                                : 'border border-navy-border bg-navy text-slate'
                            }`}
                          >
                            {project.status === 'live' ? 'Live' : 'Coming Soon'}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-light-slate mt-0.5">
                          {project.description}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {project.slug === 'whisperflow' ? (
                            <>
                              <span className="rounded bg-navy px-2 py-1 font-mono text-[11px] text-slate">
                                4 Releases: Windows (.exe) · Android (.apk) · Linux · macOS
                              </span>
                              <span className="rounded bg-navy px-2 py-1 font-mono text-[11px] text-slate">
                                3 Tunnels: Local Speech · Local LLM · Remote VPS
                              </span>
                              <span className="rounded bg-green/10 border border-green/20 px-2 py-1 font-mono text-[11px] text-green">
                                Live
                              </span>
                            </>
                          ) : (
                            <span className="rounded bg-navy px-2 py-1 font-mono text-[11px] text-slate/70">
                              No configuration required yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs font-semibold text-green group-hover:translate-x-1 transition-transform">
                      <span>{project.slug === 'whisperflow' ? 'Manage Releases & Tunnels' : 'View Status'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}

              {projects === null && (
                <div className="rounded-2xl border border-navy-border bg-light-navy/30 p-8 text-center font-mono text-xs text-slate">
                  Loading projects…
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Selected Project Secret Management: WhisperFlow */}
        {projectSlug === 'whisperflow' && (
          <div className="space-y-12">
            {/* Section A: App Binaries & Releases (The 4 Options: Windows, Android, Linux, macOS) */}
            <div className="space-y-6">
              <div className="border-b border-navy-border/60 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-lightest-slate">App Releases & Client Binaries</h2>
                      <span className="rounded-full border border-green/30 bg-green-tint px-2 py-0.5 font-mono text-[10px] font-semibold text-green">
                        4 Platform Options
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate">
                      Manage installable releases for Windows, Android, Linux, and macOS. Uploading a new version replaces the old binary in storage automatically. If you uploaded the wrong file, delete it immediately to avoid user errors.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void reloadDownloads()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-navy-border bg-light-navy/60 px-3 py-1.5 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green transition-all"
                  >
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
                      className="rounded-2xl border border-navy-border bg-light-navy/50 p-6 space-y-5 transition-all hover:border-navy-border/90 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Platform Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green/30 bg-green-tint text-green">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-lightest-slate">{conf.label}</h3>
                                <span className="rounded bg-navy px-2 py-0.5 font-mono text-[10px] text-light-slate">
                                  {conf.extBadge}
                                </span>
                              </div>
                              <p className="text-xs text-slate mt-0.5">{conf.desc}</p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {activeDownload ? (
                            <span className="inline-flex items-center gap-1 shrink-0 rounded-full border border-green/30 bg-green-tint px-2.5 py-1 font-mono text-[10px] font-semibold text-green">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>v{activeDownload.version || '1.0'}</span>
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full border border-navy-border bg-navy px-2.5 py-1 font-mono text-[10px] text-slate">
                              No binary
                            </span>
                          )}
                        </div>

                        {/* Active Binary Info Box */}
                        {activeDownload && (
                          <div className="rounded-xl border border-navy-border bg-navy/60 p-4 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-slate">Current File:</span>
                              <span className="font-mono font-semibold text-lightest-slate">
                                {activeDownload.filename}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-slate">Binary Size:</span>
                              <span className="font-mono text-green">
                                {formatBytes(activeDownload.size)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-slate">Version Tag:</span>
                              <span className="font-mono text-light-slate">
                                {activeDownload.version || 'none'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-slate">Last Deployed:</span>
                              <span className="font-mono text-[11px] text-slate">
                                {new Date(activeDownload.updated_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Actions Row */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-navy-border/60">
                              <a
                                href={downloadUrl('whisperflow', conf.platform)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-navy-border bg-light-navy/60 px-3 py-1.5 font-mono text-[11px] text-light-slate hover:border-green/40 hover:text-green transition-all"
                              >
                                <Download className="h-3 w-3" />
                                <span>Test Download</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => setConfirmDeletePlatform(conf.platform)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff8b8b]/30 bg-[#ff8b8b]/10 px-3 py-1.5 font-mono text-[11px] font-semibold text-[#ff8b8b] hover:bg-[#ff8b8b]/20 transition-all"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete Binary</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline Delete Confirmation Dialog */}
                        {isConfirmingDelete && (
                          <div className="rounded-xl border border-[#ff8b8b]/50 bg-[#ff8b8b]/10 p-4 space-y-3">
                            <div className="flex items-start gap-2.5 text-xs text-[#ff8b8b]">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-semibold">Confirm Deletion</p>
                                <p className="text-[11px] text-[#ff8b8b]/90 leading-relaxed">
                                  If you uploaded the wrong file, deleting will immediately purge it from storage and stop offering it to users.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setConfirmDeletePlatform(null)}
                                disabled={isDeleting}
                                className="rounded-lg border border-navy-border bg-navy px-3 py-1.5 font-mono text-[11px] text-slate hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(conf.platform)}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff8b8b] px-3 py-1.5 font-mono text-[11px] font-semibold text-navy hover:bg-[#ff8b8b]/90 disabled:opacity-50"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>{isDeleting ? 'Deleting…' : 'Yes, Delete Binary'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Upload / Replace Form */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-lightest-slate">
                              {activeDownload ? 'Upload New Version (Replace Old)' : 'Upload Initial Release'}
                            </span>
                            <span className="font-mono text-[10px] text-slate">
                              Auto-replaces storage key
                            </span>
                          </div>

                          {!selectedFile ? (
                            <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-border bg-navy/40 p-4 cursor-pointer hover:border-green/50 hover:bg-navy/70 transition-all text-center">
                              <Upload className="h-5 w-5 text-slate mb-1" />
                              <span className="font-mono text-xs text-light-slate">
                                Select <strong className="text-green">{conf.extBadge}</strong> binary
                              </span>
                              <span className="text-[10px] text-slate mt-0.5">
                                Click or drag file here
                              </span>
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
                            <div className="space-y-3 rounded-xl border border-green/30 bg-green-tint/30 p-4">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <FileCode className="h-4 w-4 text-green" />
                                  <span className="font-mono font-semibold text-lightest-slate truncate max-w-[180px]">
                                    {selectedFile.name}
                                  </span>
                                </div>
                                <span className="font-mono text-[11px] text-slate">
                                  {formatBytes(selectedFile.size)}
                                </span>
                              </div>

                              <div className="grid gap-2 sm:grid-cols-2">
                                <div>
                                  <label className="block font-mono text-[10px] uppercase text-slate mb-1">
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
                                    className="w-full rounded-lg border border-navy-border bg-navy px-3 py-1.5 font-mono text-xs text-lightest-slate outline-none focus:border-green"
                                  />
                                </div>

                                <div>
                                  <label className="block font-mono text-[10px] uppercase text-slate mb-1">
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
                                    className="w-full rounded-lg border border-navy-border bg-navy px-3 py-1.5 font-mono text-xs text-lightest-slate outline-none focus:border-green"
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
                                  className="rounded-lg border border-navy-border bg-navy px-3 py-1.5 font-mono text-[11px] text-slate hover:text-white"
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  onClick={() => void handleUpload(conf.platform)}
                                  disabled={isUploading}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-green px-4 py-1.5 font-mono text-[11px] font-semibold text-navy hover:bg-green/90 disabled:opacity-50 transition-all"
                                >
                                  <Upload className="h-3 w-3" />
                                  <span>{isUploading ? 'Uploading…' : 'Upload & Replace'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Per-Platform Alerts */}
                        {alert && (
                          <div
                            className={`rounded-xl border p-3 text-xs flex items-center gap-2 ${
                              alert.type === 'error'
                                ? 'border-[#ff8b8b]/30 bg-[#ff8b8b]/10 text-[#ff8b8b]'
                                : 'border-green/30 bg-green-tint text-green font-mono'
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
            </div>

            {/* Section B: Gateway Tunnels */}
            <div className="space-y-6 pt-4 border-t border-navy-border/60">
              <div className="flex items-center justify-between border-b border-navy-border/60 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-lightest-slate">WhisperFlow Gateway Tunnels</h2>
                  <p className="text-xs text-slate">
                    Use any free tunnel (e.g. cloudflared, ngrok, bore, or reverse SSH) to expose your local or VPS gateways.
                  </p>
                </div>
              </div>

            <div className="grid gap-6">
              {links.map((link) => {
                const meta = linkMeta[`${link.role}:${link.placement}`] || {
                  title: `${link.role} · ${link.placement}`,
                  desc: 'Model service link',
                  icon: Cpu,
                  hint: '',
                };
                const Icon = meta.icon
                const isSaving = savingId === link.id

                return (
                  <form
                    key={link.id}
                    onSubmit={(e) => {
                      e.preventDefault()
                      void saveLink(link)
                    }}
                    className="rounded-2xl border border-navy-border bg-light-navy/50 p-6 space-y-4 transition-all hover:border-navy-border/90"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green/30 bg-green-tint text-green">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-lightest-slate">{meta.title}</h3>
                            <span className="rounded bg-navy px-2 py-0.5 font-mono text-[10px] text-light-slate">
                              {link.role}:{link.placement}
                            </span>
                          </div>
                          <p className="text-xs text-slate mt-0.5">{meta.desc}</p>
                        </div>
                      </div>

                      {/* Enable / Disable Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="font-mono text-xs text-light-slate">
                          {link.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <div className="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={link.enabled}
                            onChange={(e) => updateLink(link.id, { enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-navy rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-lightest-slate after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green" />
                        </div>
                      </label>
                    </div>

                    {/* URL Input */}
                    <div>
                      <label className="font-mono text-xs text-slate">Tunnel Endpoint URL</label>
                      <input
                        value={link.url}
                        onChange={(e) => updateLink(link.id, { url: e.target.value })}
                        placeholder="https://..."
                        className="mt-1.5 w-full rounded-xl border border-navy-border bg-navy px-4 py-2.5 font-mono text-xs text-lightest-slate outline-none focus:border-green"
                      />
                    </div>

                    {meta.hint && (
                      <p className="font-mono text-[11px] text-slate/80">{meta.hint}</p>
                    )}

                    <div className="flex items-center justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-lg bg-green px-4 py-2 font-mono text-xs font-semibold text-navy hover:bg-green/90 disabled:opacity-50 transition-all"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </form>
                )
              })}

              {links.length === 0 && !error && (
                <div className="rounded-2xl border border-navy-border bg-light-navy/40 p-8 text-center font-mono text-xs text-slate">
                  Loading model links…
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* VIEW 3: Other Projects (e.g. Chatbot) */}
        {projectSlug && projectSlug !== 'whisperflow' && (
          <div className="rounded-2xl border border-navy-border bg-light-navy/40 p-8 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-navy-border bg-navy text-slate">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-lightest-slate capitalize">{projectSlug} Service</h3>
            <p className="text-xs text-slate max-w-md mx-auto">
              This service is currently in development. Model gateway endpoints, tunnels, and API tokens will be configurable here once the project goes live.
            </p>
            <div className="pt-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-lg border border-navy-border px-4 py-2 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green"
              >
                <span>← Back to All Projects</span>
              </Link>
            </div>
          </div>
        )}

        {/* Security & Role Verification Guarantee Strip */}
        <section className="rounded-2xl border border-navy-border bg-light-navy/30 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-green" />
            <h3 className="font-bold text-lightest-slate text-sm">Role-Enforced Infrastructure Security</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate">
            Backend endpoints under <code className="text-light-slate">/api/studio/whisperflow/links</code> strictly enforce role authorization via <code className="text-light-slate">AdminDep</code>. Unauthenticated requests receive 401, while authenticated non-admin users receive 403 Forbidden. Tunnel URLs are contacted directly by the backend with private <code className="text-light-slate">X-Flow-Token</code> authentication headers and are never exposed publicly.
          </p>
        </section>
      </div>
    </DashboardLayout>
  )
}
