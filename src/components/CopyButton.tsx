import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyText } from '@/lib/copy'

export function CopyButton({
  text,
  label = 'Copy',
  className = '',
  iconOnly = false,
}: {
  text: string
  label?: string
  className?: string
  iconOnly?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function onClick() {
    const ok = await copyText(text)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
        copied
          ? 'border-green/50 bg-green-tint text-green shadow-sm shadow-green/20'
          : 'border-navy-border bg-navy/80 text-slate hover:border-green/40 hover:bg-light-navy hover:text-white'
      } ${className}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />}
      {!iconOnly && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  )
}
