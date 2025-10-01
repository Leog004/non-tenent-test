import React from 'react'
import Sidebar from './Sidebar'
import { renderNode } from '../render'

export default function EditorHost({ editorsList, panel, ctx }) {
  const [items, setItems] = React.useState([])
  const [activeId, setActiveId] = React.useState(null)
  const [panelManifest, setPanelManifest] = React.useState(null)

  // Load editors list
  React.useEffect(() => {
    const [method, url] = editorsList.source.split(':', 2)
    fetch(url, { method, credentials: 'include' })
      .then(r => r.json())
      .then(list => {
        setItems(list)
        if (!activeId && list[0]) setActiveId(list[0].id)
      })
  }, [editorsList?.source])

  // Load panel when activeId changes
React.useEffect(() => {
  if (!activeId) return
  const [method, urlTmpl] = panel.source.split(':', 2)
  const url = urlTmpl.replace('{id}', activeId)
  fetch(url, { method, credentials: 'include' })
    .then(r => r.json())
    .then(setPanelManifest)
}, [panel?.source, activeId, ctx?.refreshTick])  // <-- add ctx.refreshTick

  return (
    <div style={{display:'grid', gridTemplateColumns:'220px 1fr', height:'100%'}}>
      <Sidebar items={items} activeId={activeId} onSelect={setActiveId} title="Editors" />
      <main style={{padding:16}}>
        {panelManifest ? renderNode(panelManifest.root, ctx) : <div>Loading…</div>}
      </main>
    </div>
  )
}
