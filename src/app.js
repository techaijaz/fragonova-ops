import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import router from './router/apiRouter.js'
import globalErrorHandler, { notFoundError } from './middleware/globalErrorHandler.js'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middlewares
app.use(helmet())
app.use(cookieParser())
app.use(
    cors({
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
        origin: '*',
        credentials: true
    })
)

app.use((req, res, next) => {
    if (req.path.startsWith('/api/v1/webhooks/shopify')) {
        express.text({ type: '*/*' })(req, res, () => {
            next()
        })
    } else {
        next()
    }
})

app.use(express.json())
app.use(express.static(path.join(__dirname, '../', 'public')))

// Routes
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Server is running!' })
})
app.use('/api/v1', router)


// 404 Error handler
app.use(notFoundError)

// Global Error handler
app.use(globalErrorHandler)

export default app
