import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Download,
  Laptop,
  Smartphone,
  Terminal,
  Shield,
  Key,
  BookOpen,
  Play,
  FileText,
  Apple,
  Clock,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { api, downloadUrl, type DownloadItem } from '@/lib/api'

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function WhisperDownloadPage() {
  const [platformTab, setPlatformTab] = useState<'windows' | 'android' | 'linux' | 'macos'>('windows')
  const [downloads, setDownloads] = useState<DownloadItem[] | null>(null)

  useEffect(() => {
    api<DownloadItem[]>('/downloads')
      .then((items) => setDownloads(items.filter((item) => item.product === 'whisperflow')))
      .catch(() => setDownloads([]))
  }, [])

  const winItem = (downloads ?? []).find((d) => d.platform === 'windows')
  const androidItem = (downloads ?? []).find((d) => d.platform === 'android')
  const linuxItem = (downloads ?? []).find((d) => d.platform === 'linux')
  const macItem = (downloads ?? []).find((d) => d.platform === 'macos')

  return (
    <DashboardLayout>
      <div className="space-y-12">
        {/* Breadcrumb & Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-border/60 pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-slate">
            <Link to="/dashboard" className="hover:text-green">Dashboard</Link>
            <span>/</span>
            <Link to="/products/whisperflow" className="hover:text-green">WhisperFlow</Link>
            <span>/</span>
            <span className="text-green font-medium">Download</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/products/whisperflow"
              className="inline-flex items-center gap-1.5 rounded-md border border-navy-border bg-light-navy/50 px-3 py-1.5 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Project Details</span>
            </Link>
            <Link
              to="/products/whisperflow/docs"
              className="inline-flex items-center gap-1.5 rounded-md border border-navy-border bg-light-navy/50 px-3 py-1.5 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Docs & API</span>
            </Link>
            <Link
              to="/products/whisperflow/playground"
              className="inline-flex items-center gap-1.5 rounded-md border border-navy-border bg-light-navy/50 px-3 py-1.5 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Playground</span>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative rounded-3xl border border-navy-border/80 bg-gradient-to-b from-light-navy/70 via-light-navy/30 to-navy p-8 sm:p-12 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-green/5 blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green-tint px-3 py-1 font-mono text-xs text-green">
              <Download className="h-3.5 w-3.5 text-green" />
              <span>Native Client Downloads · v1.0 Production</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-lightest-slate sm:text-5xl leading-tight">
              Get WhisperFlow for Desktop & Android.
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-slate">
              Install the native background client on your computer or the floating bubble on your Android phone. Both clients connect to your self-hosted Studio pipeline using a single API key.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 pt-6 border-t border-navy-border/60">
            <Link
              to="/keys"
              className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 font-mono text-xs font-semibold text-navy hover:bg-green/90 transition-all active:scale-95"
            >
              <Key className="h-4 w-4" />
              <span>Get Your API Key First →</span>
            </Link>
            <span className="font-mono text-xs text-slate">
              One key authorizes all desktop and mobile apps.
            </span>
          </div>
        </div>

        {/* Platform Selector Tabs - 4 Options */}
        <div className="flex flex-wrap gap-2 border-b border-navy-border/60 pb-3">
          <button
            type="button"
            onClick={() => setPlatformTab('windows')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold transition-all ${
              platformTab === 'windows'
                ? 'bg-green-tint text-green border border-green/30 shadow-md shadow-green/10'
                : 'text-slate hover:text-white hover:bg-light-navy/40'
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>Windows Desktop</span>
            {winItem && (
              <span className="rounded-full bg-green/20 px-1.5 py-0.2 font-mono text-[9px] text-green">
                v{winItem.version || '1.0'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPlatformTab('android')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold transition-all ${
              platformTab === 'android'
                ? 'bg-green-tint text-green border border-green/30 shadow-md shadow-green/10'
                : 'text-slate hover:text-white hover:bg-light-navy/40'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Android Bubble</span>
            {androidItem && (
              <span className="rounded-full bg-green/20 px-1.5 py-0.2 font-mono text-[9px] text-green">
                v{androidItem.version || '1.0'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPlatformTab('linux')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold transition-all ${
              platformTab === 'linux'
                ? 'bg-green-tint text-green border border-green/30 shadow-md shadow-green/10'
                : 'text-slate hover:text-white hover:bg-light-navy/40'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Linux Client</span>
            {linuxItem && (
              <span className="rounded-full bg-green/20 px-1.5 py-0.2 font-mono text-[9px] text-green">
                v{linuxItem.version || '1.0'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPlatformTab('macos')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold transition-all ${
              platformTab === 'macos'
                ? 'bg-green-tint text-green border border-green/30 shadow-md shadow-green/10'
                : 'text-slate hover:text-white hover:bg-light-navy/40'
            }`}
          >
            <Apple className="h-4 w-4" />
            <span>macOS Client</span>
            {macItem ? (
              <span className="rounded-full bg-green/20 px-1.5 py-0.2 font-mono text-[9px] text-green">
                v{macItem.version || '1.0'}
              </span>
            ) : (
              <span className="rounded-full bg-navy px-1.5 py-0.2 font-mono text-[9px] text-slate">
                soon
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Windows Desktop */}
        {platformTab === 'windows' && (
          <div className="rounded-3xl border border-navy-border bg-light-navy/50 p-6 sm:p-10 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-navy-border/60">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-md bg-green/10 border border-green/30 px-2 py-0.5 font-mono text-xs font-bold text-green">
                    Windows
                  </span>
                  <h2 className="text-2xl font-bold text-lightest-slate">StudioFlow for Windows</h2>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-slate">
                  Lightweight background client that stays minimized in your system tray. Press your record shortcut, speak, press stop, and formatted text is instantly simulated into your active cursor without taking away window focus.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <a
                  href={downloadUrl('whisperflow', 'windows')}
                  download={winItem?.filename || 'StudioFlow.exe'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green px-6 py-3 font-mono text-xs font-semibold text-navy hover:bg-green/90 transition-all active:scale-95 shadow-lg shadow-green/20"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    Download {winItem?.filename || '.EXE'} (
                    {winItem ? `${formatBytes(winItem.size)} · v${winItem.version}` : '13 MB'})
                  </span>
                </a>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-green font-semibold">
                Installation & Configuration Guide
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-navy-border bg-navy/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-green font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green/10 border border-green/30">1</span>
                    <span>Install & Launch</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">
                    Download and run <code className="text-light-slate">{winItem?.filename || 'StudioFlow.exe'}</code>. If Windows SmartScreen appears, click "More info" and "Run anyway". The app will appear in your system tray.
                  </p>
                </div>

                <div className="rounded-2xl border border-navy-border bg-navy/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-green font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green/10 border border-green/30">2</span>
                    <span>Configure API Key</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">
                    Copy your key from <Link to="/keys" className="text-green underline">API Keys</Link>. Press <code className="text-light-slate">Ctrl+Alt+S</code> or click the tray icon to open Settings and paste your key.
                  </p>
                </div>

                <div className="rounded-2xl border border-navy-border bg-navy/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-green font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green/10 border border-green/30">3</span>
                    <span>Set Hotkeys</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">
                    In Settings, click "Choose" to assign your preferred record and stop keys. A modifier like Ctrl, Alt, or Win plus a key ensures no keyboard conflicts.
                  </p>
                </div>

                <div className="rounded-2xl border border-navy-border bg-navy/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-green font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green/10 border border-green/30">4</span>
                    <span>Dictate Anywhere</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">
                    Click into any editor (VS Code, Word, Chrome, Slack). Press record, speak your thoughts, press stop. Text pastes instantly without stealing fullscreen window state.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Android Bubble */}
        {platformTab === 'android' && (
          <div className="rounded-3xl border border-navy-border bg-light-navy/50 p-6 sm:p-10 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-navy-border/60">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-md bg-green/10 border border-green/30 px-2 py-0.5 font-mono text-xs font-bold text-green">
                    Android
                  </span>
                  <h2 className="text-2xl font-bold text-lightest-slate">StudioFlow for Android</h2>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-slate">
                  A floating bubble that appears next to whatever you are typing in. Keep your own keyboard: tap the bubble, speak, tap again, and the text lands in WhatsApp, Telegram, Slack, Gmail, or your browser.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={downloadUrl('whisperflow', 'android')}
                  download={androidItem?.filename || 'StudioFlow.apk'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green px-6 py-3 font-mono text-xs font-semibold text-navy hover:bg-green/90 transition-all active:scale-95 shadow-lg shadow-green/20"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    Download {androidItem?.filename || 'APK'} (
                    {androidItem ? `${formatBytes(androidItem.size)} · v${androidItem.version}` : 'APK'})
                  </span>
                </a>
              </div>
            </div>

            {/* Android Setup Instructions */}
            <div className="space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-green font-semibold">
                Android Setup Instructions
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-navy-border bg-navy/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-green font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green/10 border border-green/30">1</span>
                    <span>Install APK</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">
                    Download <code className="text-light-slate">{androidItem?.filename || 'StudioFlow.apk'}</code> directly on your phone and tap to install. Allow installing unknown apps if prompted.
                  </p>
                </div>

                <div className="rounded-2xl border border-navy-border bg-navy/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-green font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green/10 border border-green/30">2</span>
                    <span>Turn On the Bubble</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">
                    Open Studio Flow and tap <strong>Open Accessibility settings</strong>, then switch on <strong>Studio Flow</strong>. If the switch is greyed out, use <strong>App info &gt; ⋮ &gt; Allow restricted settings</strong> first.
                  </p>
                </div>

                <div className="rounded-2xl border border-navy-border bg-navy/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-green font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green/10 border border-green/30">3</span>
                    <span>Paste Key & Start</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">
                    In the Studio Flow app, paste your API key, allow the microphone, and tap Start. Then tap the bubble next to any text box to dictate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Linux Client */}
        {platformTab === 'linux' && (
          <div className="rounded-3xl border border-navy-border bg-light-navy/50 p-6 sm:p-10 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-navy-border/60">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-md bg-green/10 border border-green/30 px-2 py-0.5 font-mono text-xs font-bold text-green">
                    Linux
                  </span>
                  <h2 className="text-2xl font-bold text-lightest-slate">StudioFlow for Linux</h2>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-slate">
                  A single standalone binary for Ubuntu, Debian, Arch, or Fedora. Nothing to install.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={downloadUrl('whisperflow', 'linux')}
                  download={linuxItem?.filename || 'StudioFlow'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green px-6 py-3 font-mono text-xs font-semibold text-navy hover:bg-green/90 transition-all active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    Download {linuxItem?.filename || 'Linux Package'} (
                    {linuxItem ? `${formatBytes(linuxItem.size)} · v${linuxItem.version}` : 'binary'})
                  </span>
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-green font-semibold">Quick Start (Terminal)</h3>
              <pre className="overflow-x-auto rounded-xl border border-navy-border bg-navy p-4 font-mono text-xs text-light-slate leading-relaxed">
{`# 1. Make the downloaded file runnable
chmod +x ${linuxItem?.filename || 'StudioFlow'}

# 2. Start it, paste your API key, and choose your shortcuts
./${linuxItem?.filename || 'StudioFlow'}

# Pasting into other apps needs wl-copy or xclip, plus wtype or xdotool`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: macOS Client */}
        {platformTab === 'macos' && (
          <div className="rounded-3xl border border-navy-border bg-light-navy/50 p-6 sm:p-10 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-navy-border/60">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-md bg-green/10 border border-green/30 px-2 py-0.5 font-mono text-xs font-bold text-green">
                    macOS
                  </span>
                  <h2 className="text-2xl font-bold text-lightest-slate">StudioFlow for macOS</h2>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-slate">
                  Native macOS menu bar app and background global listener with Apple Silicon and Intel support.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {macItem ? (
                  <a
                    href={downloadUrl('whisperflow', 'macos')}
                    download={macItem.filename}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green px-6 py-3 font-mono text-xs font-semibold text-navy hover:bg-green/90 transition-all active:scale-95 shadow-lg shadow-green/20"
                  >
                    <Download className="h-4 w-4" />
                    <span>
                      Download {macItem.filename} ({formatBytes(macItem.size)} · v{macItem.version})
                    </span>
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-navy-border bg-navy px-5 py-3 font-mono text-xs text-slate">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>macOS release coming soon (upload via Admin)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-green font-semibold">
                macOS Setup Guide
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-navy-border bg-navy/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-green font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green/10 border border-green/30">1</span>
                    <span>Install DMG</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">
                    Open <code className="text-light-slate">StudioFlow-macos.dmg</code> and drag StudioFlow into your <code className="text-light-slate">/Applications</code> folder.
                  </p>
                </div>

                <div className="rounded-2xl border border-navy-border bg-navy/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-green font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green/10 border border-green/30">2</span>
                    <span>Grant Permissions</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">
                    Under <strong>System Settings &gt; Privacy & Security</strong>, allow Microphone and Accessibility access so global dictation hotkeys work.
                  </p>
                </div>

                <div className="rounded-2xl border border-navy-border bg-navy/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-green font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green/10 border border-green/30">3</span>
                    <span>Set Hotkey & Dictate</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">
                    Configure your API key and dictate into any native Mac application (Notes, Slack, VS Code, Safari).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy & System Architecture Strip */}
        <section className="rounded-2xl border border-navy-border bg-light-navy/30 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green" />
            <h3 className="font-bold text-lightest-slate text-sm">Self-Hosted Privacy Guarantee</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate">
            Unlike commercial transcription tools, WhisperFlow transmits audio only to your authenticated Studio instance and executes speech models strictly on your local RTX 3060 GPU. No speech is cached or used for training.
          </p>
        </section>
      </div>
    </DashboardLayout>
  )
}
