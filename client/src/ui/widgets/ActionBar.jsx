export default function ActionBar({ actions = [], ctx }) {
  return (
    <div className="action-bar">
      {actions.map(a => (
        <button key={a.id} onClick={() => ctx.run(a)}>{a.label}</button>
      ))}
    </div>
  )
}
