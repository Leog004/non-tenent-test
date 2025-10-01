import express from 'express'
import cookieParser from 'cookie-parser'

const app = express()
app.use(cookieParser())
app.use(express.json())

// --- Simple session endpoint (demo only) ---
app.get('/session', (req, res) => {
  const caps = String(req.cookies?.caps || '').split(',').filter(Boolean)
  res.json({ userId: 'demo-user', capabilities: caps })
})

// --- Auth toggles (demo) ---
app.get('/login', (req, res) => {
  const raw = String(req.query.caps || '')
  res.cookie('caps', raw, { httpOnly: false })
  res.json({ ok: true, caps: raw.split(',').filter(Boolean) })
})
app.get('/logout', (req, res) => {
  res.clearCookie('caps')
  res.json({ ok: true })
})

// --- Editors list (filtered by caps) ---
app.get('/ui/manifest/editors', (req, res) => {
  const caps = new Set(String(req.cookies?.caps || '').split(',').filter(Boolean))
  const editors = []
  editors.push({ id:'GenericEditor', label:'Generic' })
  if (caps.has('canCreatePayment')) editors.push({ id:'paymentEditor', label:'Payments' })
  if (caps.has('canRefund'))        editors.push({ id:'refundEditor',  label:'Refunds'  })
  // Add more editors toggled by Helm/env/health as needed
  res.json(editors)
})

// --- Editor submanifests ---
app.get('/ui/manifest/editor/:id', (req, res) => {
  const id = req.params.id
  const caps = new Set(String(req.cookies?.caps || '').split(',').filter(Boolean))

  if (id === 'GenericEditor') {
    return res.json({
      version: '1.0',
      root: {
        type: 'Vertical',
        children: [
          {
            type: 'DataTable',
            data: { source: 'GET:/api/generic-payments?limit=50' },
            columns: [
              { key: 'id', label: 'ID' },
              { key: 'firstName',  label: 'First Name' },
              { key: 'lastName', label: 'Last Name' },
            ]
          }
        ]
      }
    })
  }

  if (id === 'paymentEditor' && caps.has('canCreatePayment')) {
    return res.json({
      version: '1.0',
      root: {
        type: 'Vertical',
        children: [
          {
            type: 'Form',
            submit: { label: 'Create Payment', url: 'POST:/api/payments' },
            fields: [
              { name: 'payer',  label: 'Payer',  component: 'Text'   },
              { name: 'amount', label: 'Amount', component: 'Number' }
            ]
          },
          {
            type: 'DataTable',
            data: { source: 'GET:/api/payments?limit=50' },
            columns: [
              { key: 'id',     label: 'ID' },
              { key: 'payer',  label: 'Payer' },
              { key: 'amount', label: 'Amount', format: 'currency' },
              { key: 'status', label: 'Status' }
            ]
          }
        ]
      }
    })
  }

  if (id === 'refundEditor' && caps.has('canRefund')) {
    return res.json({
      version: '1.0',
      root: {
        type: 'DataTable',
        data: { source: 'GET:/api/payments?status=PAID' },
        columns: [
          { key: 'id',     label: 'ID' },
          { key: 'payer',  label: 'Payer' },
          { key: 'amount', label: 'Amount', format: 'currency' },
          { key: 'status', label: 'Status' }
        ],
        rowActions: [
          { id: 'refund', label: 'Refund', action: { type: 'http', method: 'POST', url: 'POST:/api/payments/{id}/refund' } }
        ]
      }
    })
  }

  res.status(404).send('Editor not found')
})

// --- Page manifest that hosts EditorHost ---
app.get('/ui/manifest/page/workspace', (req, res) => {
  res.json({
    version: '1.0',
    page: {
      id: 'workspace',
      layout: {
        type: 'EditorHost',
        editorsList: { source: 'GET:/ui/manifest/editors' },
        panel:       { source: 'GET:/ui/manifest/editor/{id}' }
      }
    }
  })
})

// --- Data endpoints (with server-side enforcement) ---
const DB = [
  { id: 'p1', payer: 'Alice Smith', amount: 120.0, status: 'PAID' },
  { id: 'p2', payer: 'Bob Johnson',   amount:  80.0, status: 'DUE'  },
  { id: 'p3', payer: 'Cara Williams',  amount:  60.0, status: 'PAID' }
]

const hasCap = (req, name) => new Set(String(req.cookies?.caps || '').split(',').filter(Boolean)).has(name)

app.get('/api/payments', (req, res) => {
  const status = req.query.status
  const data = status ? DB.filter(x => x.status === status) : DB
  res.json(data)
})

app.get('/api/generic-payments', (req, res) => {
  // A more generic endpoint that returns payments with firstName/lastName instead of payer
  const data = DB.map(x => ({
    id: x.id,
    firstName: x.payer.split(' ')[0],
    lastName: x.payer.split(' ')[1] || '',
  }))
  res.json(data)
});

app.post('/api/payments', (req, res) => {
  if (!hasCap(req, 'canCreatePayment')) return res.status(403).send('Forbidden')
  const payer = String(req.body?.payer ?? '').trim()
  const amount = Number(req.body?.amount)
  if (!payer) return res.status(400).send('payer is required')
  if (!Number.isFinite(amount) || amount < 0) return res.status(400).send('amount must be >= 0')
  const id = 'p' + (Math.random().toString(36).slice(2,7))
  DB.push({ id, payer, amount, status: 'DUE' })
  res.json({ ok: true, id })
})

app.post('/api/payments/:id/refund', (req, res) => {
  if (!hasCap(req, 'canRefund')) return res.status(403).send('Forbidden')
  const p = DB.find(x => x.id === req.params.id)
  if (!p) return res.status(404).send('Not found')
  if (p.status !== 'PAID') return res.status(409).send('Only PAID can be refunded')
  p.status = 'REFUNDED'
  res.json({ ok: true })
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log('BFF on http://localhost:' + port))
