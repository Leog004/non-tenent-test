import React from 'react'

export default function Form({ fields = [], submit, ctx }) {
  const buildDefaults = React.useCallback(
    () => Object.fromEntries(fields.map(f => [f.name, f.component === 'Number' ? '' : ''])),
    [fields]
  )
  const [values, setValues] = React.useState(buildDefaults)

  React.useEffect(() => { setValues(buildDefaults()) }, [buildDefaults])

  function set(name, val) { setValues(v => ({ ...v, [name]: val })) }

  async function onSubmit(e) {
    e.preventDefault()
    const [method, url] = submit.url.split(':', 2)

    const payload = { ...values }
    for (const f of fields) {
      if (f.component === 'Number' && payload[f.name] !== '') {
        const n = Number(payload[f.name])
        if (!Number.isFinite(n)) { alert(`${f.label||f.name} must be a number`); return }
        payload[f.name] = n
      }
    }

    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    })
    if (!r.ok) { alert('Error: ' + (await r.text())); return }
    ctx?.refresh?.()
    alert('Created')
  }

  return (
    <form onSubmit={onSubmit}>
      {fields.map(f => (
        <div key={f.name} style={{marginBottom:8}}>
          <label>
            <div>{f.label || f.name}</div>
            {f.component === 'Select' ? (
              <select value={values[f.name] ?? ''} onChange={e=>set(f.name, e.target.value)}>
                <option value="">Select…</option>
                {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                type={f.component === 'Number' ? 'number' : 'text'}
                value={values[f.name] ?? ''}
                onChange={e=>set(f.name, e.target.value)}
              />
            )}
          </label>
        </div>
      ))}
      <button type="submit">{submit.label || 'Submit'}</button>
    </form>
  )
}
