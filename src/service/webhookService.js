import crypto from 'crypto'
import prisma from '../config/prisma.js'
import logger from '../util/logger.js'

const verifyShopifyWebhook = (rawBody, secret, signature) => {
    const hmac = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))
}

export const handleOrderCreate = async (rawBody) => {
    try {
        const order = JSON.parse(rawBody).order || JSON.parse(rawBody)

        const existing = await prisma.order.findUnique({
            where: { shopifyOrderId: String(order.id) }
        })

        if (existing) {
            logger.info('Order already exists', { orderId: order.id })
            return { status: 'skipped' }
        }

        const statusMap = {
            'open': 'NEW',
            'pending': 'NEW',
            'processing': 'CONFIRMED',
            'in_progress': 'CONFIRMED',
            'fulfilled': 'PACKED',
            'partially_fulfilled': 'PACKED',
            'cancelled': 'CANCELLED'
        }

        const internalStatus = statusMap[order.financial_status] || statusMap[order.status] || 'NEW'

        await prisma.order.create({
            data: {
                shopifyOrderId: String(order.id),
                source: 'SHOPIFY',
                customerName: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim(),
                customerPhone: order.shipping_address?.phone || null,
                customerEmail: order.email || null,
                customerAddress: order.shipping_address?.address1 || null,
                customerPincode: order.shipping_address?.zip || null,
                status: internalStatus,
                paymentStatus: order.financial_status === 'paid' ? 'PAID' : 'PENDING',
                subtotal: parseFloat(order.subtotal_price || 0),
                discount: parseFloat(order.total_discounts || 0),
                total: parseFloat(order.total_price || 0),
                tax: parseFloat(order.total_tax || 0),
                items: {
                    create: order.line_items?.map(item => ({
                        productVariantId: item.variant_id ? String(item.variant_id) : null,
                        productName: item.title,
                        variantLabel: item.variant_title || '',
                        qty: item.quantity,
                        rate: parseFloat(item.price || 0),
                        total: parseFloat(item.price || 0) * item.quantity
                    })) || []
                }
            }
        })

        logger.info('Webhook order created', { orderId: order.id })
        return { status: 'created' }
    } catch (error) {
        logger.error('Webhook order create failed', { error: error.message })
        throw error
    }
}

export const handleOrderUpdated = async (rawBody) => {
    try {
        const order = JSON.parse(rawBody).order || JSON.parse(rawBody)

        const existing = await prisma.order.findUnique({
            where: { shopifyOrderId: String(order.id) }
        })

        if (!existing) {
            logger.info('Order not found for update, triggering sync', { orderId: order.id })
            return { status: 'not_found' }
        }

        const statusMap = {
            'open': 'NEW',
            'pending': 'NEW',
            'processing': 'CONFIRMED',
            'in_progress': 'CONFIRMED',
            'fulfilled': 'PACKED',
            'partially_fulfilled': 'PACKED',
            'cancelled': 'CANCELLED'
        }

        const internalStatus = statusMap[order.financial_status] || statusMap[order.status] || existing.status

        await prisma.order.update({
            where: { id: existing.id },
            data: {
                status: internalStatus,
                paymentStatus: order.financial_status === 'paid' ? 'PAID' : existing.paymentStatus,
                subtotal: parseFloat(order.subtotal_price || existing.subtotal),
                discount: parseFloat(order.total_discounts || existing.discount),
                total: parseFloat(order.total_price || existing.total),
                tax: parseFloat(order.total_tax || existing.tax)
            }
        })

        logger.info('Webhook order updated', { orderId: order.id })
        return { status: 'updated' }
    } catch (error) {
        logger.error('Webhook order update failed', { error: error.message })
        throw error
    }
}

export const handleOrderCancelled = async (rawBody) => {
    try {
        const order = JSON.parse(rawBody).order || JSON.parse(rawBody)

        const existing = await prisma.order.findUnique({
            where: { shopifyOrderId: String(order.id) }
        })

        if (!existing) {
            return { status: 'not_found' }
        }

        await prisma.order.update({
            where: { id: existing.id },
            data: { status: 'CANCELLED' }
        })

        logger.info('Webhook order cancelled', { orderId: order.id })
        return { status: 'cancelled' }
    } catch (error) {
        logger.error('Webhook order cancel failed', { error: error.message })
        throw error
    }
}

export { verifyShopifyWebhook }
