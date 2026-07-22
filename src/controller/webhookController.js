import { verifyShopifyWebhook, handleOrderCreate, handleOrderUpdated, handleOrderCancelled } from '../service/webhookService.js'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'

export const handleOrdersCreate = (req, res, next) => {
    try {
        const signature = req.headers['x-shopify-hmac-sha256']
        const rawBody = req.body

        if (!verifyShopifyWebhook(rawBody, process.env.SHOPIFY_WEBHOOK_SECRET || '', signature)) {
            return res.status(401).json({ message: 'Invalid webhook' })
        }

        handleOrderCreate(rawBody)
            .then(result => {
                httpResponse(req, res, 200, 'Webhook processed successfully', result)
            })
            .catch(err => {
                httpError(next, err, req, 500)
            })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const handleOrdersUpdated = (req, res, next) => {
    try {
        const signature = req.headers['x-shopify-hmac-sha256']
        const rawBody = req.body

        if (!verifyShopifyWebhook(rawBody, process.env.SHOPIFY_WEBHOOK_SECRET || '', signature)) {
            return res.status(401).json({ message: 'Invalid webhook' })
        }

        handleOrderUpdated(rawBody)
            .then(result => {
                httpResponse(req, res, 200, 'Webhook processed successfully', result)
            })
            .catch(err => {
                httpError(next, err, req, 500)
            })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const handleOrdersCancelled = (req, res, next) => {
    try {
        const signature = req.headers['x-shopify-hmac-sha256']
        const rawBody = req.body

        if (!verifyShopifyWebhook(rawBody, process.env.SHOPIFY_WEBHOOK_SECRET || '', signature)) {
            return res.status(401).json({ message: 'Invalid webhook' })
        }

        handleOrderCancelled(rawBody)
            .then(result => {
                httpResponse(req, res, 200, 'Webhook processed successfully', result)
            })
            .catch(err => {
                httpError(next, err, req, 500)
            })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}
