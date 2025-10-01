import React from 'react'
import { renderNode } from './ui/render'

export default function App() {
  const [caps, setCaps] = React.useState([])
  const [manifest, setManifest] = React.useState(null)
  const [user, setUser] = React.useState('no-user-signed-in')
  const [refreshTick, setRefreshTick] = React.useState(0)   // <-- add

  async function refresh() {
    const s = await fetch('/session', { credentials: 'include' }).then(r=>r.json())
    setCaps(s.capabilities || [])
    setUser(s.userId || 'no-user-signed-in')
    const m = await fetch('/ui/manifest/payments', { credentials: 'include' }).then(r=>r.json())
    setManifest(m)
    setRefreshTick(t => t + 1) 
  }

  React.useEffect(() => { refresh() }, [])

  const ctx = React.useMemo(() => ({
    can: new Set(caps),
    refresh,                                               // <-- expose refresh
    refreshTick,                                           // <-- expose tick for effects
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
          refresh()                                        // <-- reuse the same refresh
        }
      }
    }
  }), [caps, refreshTick])    

  return (
    <>
      <header>
        <strong>Server-Driven UI Demo</strong>
        <span>Signed in as <code>{user}</code></span>
        <span>Caps: <code>{caps.join(', ') || 'none'}</code></span>
        <button onClick={() => fetch('/login?caps=canCreatePayment', {credentials:'include'}).then(refresh)}>Login: Create only</button>
        <button onClick={() => fetch('/login?caps=canCreatePayment,canRefund', {credentials:'include'}).then(refresh)}>Login: Create + Refund</button>
        <button onClick={() => fetch('/logout', {credentials:'include'}).then(refresh)}>Logout</button>
      </header>
      <div className="container">
        {!manifest ? <div>Loading…</div> : renderNode(manifest.page.layout, ctx)}
      </div>
    </>
  )
}
