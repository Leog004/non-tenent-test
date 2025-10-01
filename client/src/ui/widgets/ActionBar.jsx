import React from "react"
import { isVisible } from '../visibility'

export default function ActionBar({ actions = [], ctx }) {
  return (
    <div className="action-bar">
      {actions.filter(a => isVisible(a.visibility, ctx)).map(a => (
        <button key={a.id} onClick={() => ctx.run(a)}>{a.label}</button>
      ))}
    </div>
  )
}
