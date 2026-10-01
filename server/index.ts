import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { config } from 'dotenv'
import { getSessionUser, requireAuth, requireAdmin } from './auth.js'
import { db } from './db.js'
import { apiRouter } from './api.js'
import { authRouter } from './authRoutes.js'

config()

const app = new Hono()

app.use('*', logger())
app.use('*', secureHeaders())

app.use('*', cors({
  origin: process.env.ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

app.route('/api', apiRouter)
app.route('/api/auth', authRouter)

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
