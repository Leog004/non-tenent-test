import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'

const app = express()
app.use(express.json())
app.use(cookieParser())

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

// --- Simple in-memory data ---
const DB = [
  { id: 'p1', payer: 'Alice', amount: 120.0, status: 'PAID' },
  { id: 'p2', payer: 'Bob',   amount:  80.0, status: 'DUE'  },
  { id: 'p3', payer: 'Cara',  amount:  60.0, status: 'PAID' }
]

// --- Auth/session helpers ---
function parseCaps(req) {
  const token = req.cookies?.session
  if (!token) return { userId: 'no-user-signed-in', capabilities: [] }
  try {
    const p = jwt.verify(token, JWT_SECRET)
    return { userId: p.sub || 'user', capabilities: p.capabilities || [] }
  } catch {
    return { userId: 'no-user-signed-in', capabilities: [] }
  }
}

function requireCaps(...needed) {
  return (req, res, next) => {
    const { capabilities } = parseCaps(req)
    const have = new Set(capabilities)
    const ok = needed.every(c => have.has(c))
    if (!ok) return res.status(403).send('Forbidden')
    next()
  }
}

// --- Demo auth endpoints ---
app.get('/login', (req, res) => {
  const caps = String(req.query.caps || '').split(',').map(s => s.trim()).filter(Boolean)
  const token = jwt.sign({ sub: 'demo-user', capabilities: caps }, JWT_SECRET, { expiresIn: '1h' })
  res.cookie('session', token, { httpOnly: true })
  res.json({ ok: true, capabilities: caps })
})
app.get('/logout', (req, res) => {
  res.clearCookie('session')
  res.json({ ok: true })
})

// --- Session info ---
app.get('/session', (req, res) => {
  res.json(parseCaps(req))
})

// --- UI Manifest (Refund action added only when cap present) ---
// app.get('/ui/manifest/payments', (req, res) => {
//   const { capabilities } = parseCaps(req)
//   const actions = []
//   if (capabilities.includes('canCreatePayment')) {
//     actions.push({
//       id: 'newPayment',
//       label: 'New Payment',
//       visibility: { anyOf: ['canCreatePayment'] },
//       action: { type: 'openModal', target: 'newPaymentForm' } // not wired for brevity
//     })
//   }
//   const rowActions = []
//   if (capabilities.includes('canRefund')) {
//     rowActions.push({
//       id: 'refund',
//       label: 'Refund',
//       visibility: { anyOf: ['canRefund'] },
//       action: { type: 'http', method: 'POST', url: 'POST:/api/payments/{id}/refund' }
//     })
//   }
//   res.json({
//     version: '1.0',
//     page: {
//       id: 'payments-index',
//       layout: {
//         type: 'Vertical',
//         children: [
//           { type: 'ActionBar', actions },
//           {
//             type: 'DataTable',
//             data: { source: 'GET:/api/payments?limit=50' },
//             columns: [
//               { key: 'id', label: 'ID' },
//               { key: 'payer', label: 'Payer' },
//               { key: 'amount', label: 'Amount', format: 'currency' },
//               { key: 'status', label: 'Status' }
//             ],
//             rowActions
//           }
//         ]
//       }
//     }
//   })
// })
app.get('/ui/manifest/payments', (req, res) => {
  const { capabilities } = parseCaps(req)
  const canCreate = capabilities.includes('canCreatePayment')
  const canRefund = capabilities.includes('canRefund')

  const children = []

  // (A) Optional ActionBar (neutral)
  children.push({ type: 'ActionBar', actions: [] })

  // (B) Show a Form when user can create
  if (canCreate) {
    children.push({
      order: 1,
      type: 'Form',
      submit: { label: 'Create Payment', url: 'POST:/api/payments' },
      fields: [
        { name: 'payer',  label: 'Payer',  component: 'Text'   },
        { name: 'amount', label: 'Amount', component: 'Number' }
      ]
    })
  }

  // (C) Payments table with optional Refund row action
  const rowActions = []
  if (canRefund) {
    rowActions.push({
      id: 'refund',
      label: 'Refund',
      action: { type: 'http', method: 'POST', url: 'POST:/api/payments/{id}/refund' }
    })
  }

  children.push({
    order: 2,
    type: 'DataTable',
    data: { source: 'GET:/api/payments?limit=50' },
    columns: [
      { key: 'id',     label: 'ID' },
      { key: 'payer',  label: 'Payer' },
      { key: 'amount', label: 'Amount', format: 'currency' },
      { key: 'status', label: 'Status' }
    ],
    rowActions
  })


  // (D) Sort by order, then type (stable)
  children.sort((a,b) => (a.order || 99) - (b.order || 99) || a.type.localeCompare(b.type))
  

  res.json({
    version: '1.0',
    page: { id: 'payments-index', layout: { type: 'Vertical', children } }
  })
})

// --- Data endpoints (server re-checks caps) ---
app.get('/api/payments', (_req, res) => {
  res.json(DB)
})

app.post('/api/payments/:id/refund', requireCaps('canRefund'), (req, res) => {
  const id = req.params.id
  const p = DB.find(x => x.id === id)
  if (!p) return res.status(404).send('Not found')
  if (p.status !== 'PAID') return res.status(409).send('Only PAID can be refunded')
  p.status = 'REFUNDED'
  res.json({ ok: true, id })
})


app.post('/api/payments', (req, res) => {
  const { capabilities } = parseCaps(req)
  const canCreate = capabilities.includes('canCreatePayment')

  if (!canCreate) return res.status(403).send('Forbidden')

  const payer = String(req.body?.payer ?? '').trim()
  const amountNum = Number(req.body?.amount)
  if (!payer) return res.status(400).send('payer is required')
  if (!Number.isFinite(amountNum) || amountNum < 0) return res.status(400).send('amount must be >= 0')

  const id = 'p' + (Math.random().toString(36).slice(2,7))
  DB.push({ id, payer, amount: amountNum, status: 'DUE' })
  res.json({ ok: true, id })
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`BFF listening on http://localhost:${port}`))
