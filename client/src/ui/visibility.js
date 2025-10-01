export function isVisible(rule, ctx) {
  if (!rule) return true
  if (rule.anyOf) return rule.anyOf.some(c => ctx.can.has(c))
  if (rule.allOf) return rule.allOf.every(r => typeof r === 'string' ? ctx.can.has(r) : evalPredicate(r, ctx))
  return true
}

function evalPredicate(pred, _ctx) {
  // extend with row-aware predicates as needed
  return false
}
