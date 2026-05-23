import { type ReactElement } from 'react'

/**
 * Renders markdown-style text as styled JSX.
 * Handles: ## headers, **bold**, - bullets, plain paragraphs.
 * Used exclusively for AI-generated brief content.
 */

interface Props {
  content: string
}

function applyBold(text: string): ReactElement {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-slate-900">
            {p}
          </strong>
        ) : (
          p
        )
      )}
    </>
  )
}

function parseLine(line: string, key: number): ReactElement {
  if (line.startsWith('### ')) {
    return (
      <h3 key={key} className="text-base font-semibold text-slate-800 mt-4 mb-1">
        {applyBold(line.slice(4))}
      </h3>
    )
  }
  if (line.startsWith('## ')) {
    return (
      <h2 key={key} className="text-lg font-bold text-slate-900 mt-6 mb-2 border-b border-slate-100 pb-1">
        {applyBold(line.slice(3))}
      </h2>
    )
  }
  if (line.startsWith('# ')) {
    return (
      <h1 key={key} className="text-xl font-bold text-indigo-700 mt-4 mb-3">
        {applyBold(line.slice(2))}
      </h1>
    )
  }
  if (line.startsWith('- ') || line.startsWith('* ')) {
    return (
      <li key={key} className="text-slate-700 ml-4 list-disc leading-relaxed">
        {applyBold(line.slice(2))}
      </li>
    )
  }
  if (line.trim() === '') {
    return <div key={key} className="h-2" />
  }
  return (
    <p key={key} className="text-slate-700 leading-relaxed">
      {applyBold(line)}
    </p>
  )
}

export default function MarkdownContent({ content }: Props) {
  const lines = content.split('\n')
  const elements: ReactElement[] = []
  let listBuffer: ReactElement[] = []

  lines.forEach((line, i) => {
    const isBullet = line.startsWith('- ') || line.startsWith('* ')
    if (isBullet) {
      listBuffer.push(parseLine(line, i))
    } else {
      if (listBuffer.length > 0) {
        elements.push(
          <ul key={`ul-${i}`} className="list-disc pl-5 space-y-1 my-2">
            {listBuffer}
          </ul>
        )
        listBuffer = []
      }
      elements.push(parseLine(line, i))
    }
  })

  if (listBuffer.length > 0) {
    elements.push(
      <ul key="ul-end" className="list-disc pl-5 space-y-1 my-2">
        {listBuffer}
      </ul>
    )
  }

  return <div className="space-y-1">{elements}</div>
}
