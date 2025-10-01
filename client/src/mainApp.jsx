import React from 'react'
import { renderNode } from './ui/render'

export default function App() {
  const [manifest, setManifest] = React.useState(null)
  const [user, setUser] = React.useState('no-user')
  const [caps, setCaps] = React.useState([])
  const [refreshTick, setRefreshTick] = React.useState(0)

  async function load() {
    const s = await fetch('/session', { credentials: 'include' }).then(r => r.json()).catch(()=>({userId:'no-user',capabilities:[]}))
    setUser(s.userId || 'no-user')
    setCaps(s.capabilities || [])

    const m = await fetch('/ui/manifest/page/workspace', { credentials: 'include' }).then(r => r.json())
    setManifest(m)
      setRefreshTick(t => t + 1)
  }

  React.useEffect(() => { load() }, [])

  const refresh = React.useCallback(() => {
    setRefreshTick(t => t + 1)
    // Optionally re-fetch top-level manifest:
    //load()
  }, [])

  const ctx = React.useMemo(() => ({
    can: new Set(caps),
    refresh,
    refreshTick,
    run: async (action, row) => {
      if (action.type === 'http') {
        const [method, urlSpec] = action.url.split(':', 2)
        const url = urlSpec.replace('{id}', row?.id)
        const r = await fetch(url, { method, credentials: 'include' })
        if (!r.ok) {
          const text = await r.text()
          alert(`Error ${r.status}: ${text}`)
        } else {
          alert('Success')
          refresh()
        }
      }
    }
  }), [caps, refresh, refreshTick])

  return (
    <>
      <header>
        <strong>Editors Manifest Demo</strong>
        <span>Signed in as <code>{user}</code></span>
        <span>Caps: <code>{caps.join(', ') || 'none'}</code></span>
        <button onClick={() => fetch('/login?caps=canCreatePayment', {credentials:'include'}).then(load)}>Login: Create only</button>
        <button onClick={() => fetch('/login?caps=canCreatePayment,canRefund', {credentials:'include'}).then(load)}>Login: Create + Refund</button>
        <button onClick={() => fetch('/logout', {credentials:'include'}).then(load)}>Logout</button>
      </header>
     <div className="container" key={refreshTick}>
        {!manifest ? <div style={{padding:16}}>Loading…</div> : renderNode(manifest.page.layout, ctx)}
      </div>
    </>
  )
}
