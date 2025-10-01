import React from 'react'
import { Registry } from './registry'

export function renderNode(node, ctx) {
  if (!node) return null
  const Comp = Registry[node.type] || (() => <div>Unknown: {node.type}</div>)

  const children = Array.isArray(node.children)
    ? node.children.map((c, i) => <React.Fragment key={i}>{renderNode(c, ctx)}</React.Fragment>)
    : node.content ? renderNode(node.content, ctx) : null

  return <Comp {...node} ctx={ctx}>{children}</Comp>
}
