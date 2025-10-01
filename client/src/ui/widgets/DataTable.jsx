import React from "react"
export default function DataTable({ data, columns, rowActions = [], ctx }) {
  const [rows, setRows] = React.useState([])
  React.useEffect(() => {
    const [method, url] = data.source.split(':', 2)
    fetch(url, { method, credentials: 'include' })
      .then(r => r.json())
      .then(setRows)
    }, [data?.source, ctx?.refreshTick])  

  return (
    <table>
      <thead>
        <tr>
          {columns.map(c => <th key={c.key}>{c.label}</th>)}
          {rowActions.length ? <th/> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.id}>
            {columns.map(c => <td key={c.key}>{format(row[c.key], c)}</td>)}
            {rowActions.length ? (
              <td>
                {rowActions
                  .filter(a => !a.visibility || a.visibility.anyOf?.some(cap => ctx.can.has(cap)))
                  .map(a => <button key={a.id} onClick={() => ctx.run(a, row)}>{a.label}</button>)}
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function format(v, c) {
  if (c.format === 'currency') return new Intl.NumberFormat(undefined,{style:'currency',currency:'USD'}).format(v ?? 0)
  return v ?? ''
}
