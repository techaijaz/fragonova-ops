import config from '../config/config.js'

export default async (req, res, next) => {
    try {
        const signature = req.headers['x-shopify-hmac-sha256']
        if (!signature) {
            return res.status(401).json({ message: 'Missing webhook signature' })
        }

        const rawBody = req.body || ''
        if (!rawBody) {
            return res.status(400).json({ message: 'Missing raw body' })
        }

        const crypto = await import('crypto')
        const hmac = crypto.createHmac('sha256', config.SHOPIFY.WEBHOOK_SECRET).update(rawBody, 'utf8').digest('base64')

        if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))) {
            return res.status(401).json({ message: 'Invalid webhook signature' })
        }

        next()
    } catch {
        res.status(401).json({ message: 'Unauthorized' })
    }
}
