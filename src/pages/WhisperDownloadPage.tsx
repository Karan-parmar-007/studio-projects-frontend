import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Apple, Download, Laptop, Smartphone, Terminal } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { api, downloadUrl, type DownloadItem } from '@/lib/api'

type Platform = 'windows' | 'android' | 'linux' | 'macos'

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const platforms: { id: Platform; label: string; icon: typeof Laptop }[] = [
  { id: 'windows', label: 'Windows', icon: Laptop },
  { id: 'android', label: 'Android', icon: Smartphone },
  { id: 'linux', label: 'Linux', icon: Terminal },
  { id: 'macos', label: 'macOS', icon: Apple },
]

function howToRun(platform: Platform, filename: string): string[] {
  if (platform === 'windows') {
    return [
      `Open ${filename || 'StudioFlow.exe'}. If Windows asks, choose More info, then Run anyway.`,
      'Press Ctrl+Alt+S, paste your API key, and pick a record shortcut.',
      'Click the text box you want, press the shortcut, speak, then press it again.',
    ]
  }
  if (platform === 'android') {
    return [
      `Install ${filename || 'the APK'} and allow installs from this source if Android asks.`,
      'Open the app, turn on Studio Flow in Accessibility, and paste your API key.',
      'Allow the microphone and tap Start. Tap the bubble, speak, then tap it again.',
    ]
  }
  if (platform === 'linux') {
    const name = filename || 'StudioFlow'
    return [
      `In the download folder, run chmod +x ${name} and then ./${name}.`,
      'Paste your API key and set a record shortcut.',
      'Focus a text box, press the shortcut, speak, then press it again.',
    ]
  }
  return [
    `Open ${filename || 'the disk image'} and drag StudioFlow into Applications.`,
    'Allow the microphone and Accessibility, then paste your API key.',
    'Use the menu-bar shortcut: press it, speak, press it again.',
  ]
}

export function WhisperDownloadPage() {
  const [platform, setPlatform] = useState<Platform>('windows')
  const [downloads, setDownloads] = useState<DownloadItem[] | null>(null)

  useEffect(() => {
    api<DownloadItem[]>('/downloads')
      .then((items) => setDownloads(items.filter((item) => item.product === 'whisperflow')))
      .catch(() => setDownloads([]))
  }, [])

  const current = (downloads ?? []).find((item) => item.platform === platform)
  const steps = howToRun(platform, current?.filename || '')

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Download</h1>
          <p className="text-base leading-relaxed text-slate">
            StudioFlow is the WhisperFlow app. It calls the same API as this site, with the same key, and Qwen 2.5 7B shapes the text. New builds are uploaded in the admin console.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {platforms.map((item) => {
            const Icon = item.icon
            const ready = (downloads ?? []).some((row) => row.platform === item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPlatform(item.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  platform === item.id
                    ? 'bg-green-tint text-green border border-green/30'
                    : 'border border-transparent text-slate hover:bg-light-navy hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {ready && <span className="font-mono text-[10px]">ready</span>}
              </button>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-navy-border bg-light-navy p-6">
            <h2 className="text-lg font-semibold text-white">Get the app</h2>
            <p className="mt-2 text-sm text-slate">
              {current
                ? `${current.filename} · ${formatBytes(current.size)} · v${current.version || '1.0'}`
                : 'This build is not uploaded yet.'}
            </p>
            {current ? (
              <a
                href={downloadUrl('whisperflow', platform)}
                download={current.filename}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-ink hover:bg-green-hover"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            ) : (
              <p className="mt-5 text-sm text-slate">Add the file from the admin console, then come back here.</p>
            )}
            <Link to="/keys" className="mt-4 block text-sm font-medium text-green hover:underline">
              Generate an API key first
            </Link>
          </div>

          <div className="rounded-2xl border border-navy-border bg-light-navy p-6">
            <h2 className="text-lg font-semibold text-white">How to run</h2>
            <ol className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate">
                  <span className="font-mono text-xs text-green">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
