import prisma from '../config/prisma.js'
import shopifyService from './shopifyService.js'
import logger from '../util/logger.js'

export const syncProducts = async () => {
    try {
        const response = await shopifyService.getProducts()
        const shopifyProducts = response.products || []

        let synced = 0
        let skipped = 0

        for (const sp of shopifyProducts) {
            const existing = await prisma.product.findUnique({
                where: { shopifyProductId: String(sp.id) }
            })

            if (existing) {
                skipped++
                continue
            }

            await prisma.product.create({
                data: {
                    name: sp.title,
                    description: sp.body_html || null,
                    category: sp.product_type || null,
                    shopifyProductId: String(sp.id)
                }
            })
            synced++
        }

        for (const sp of shopifyProducts) {
            const product = await prisma.product.findUnique({
                where: { shopifyProductId: String(sp.id) }
            })
            if (!product) continue

            const existingVariantIds = await prisma.productVariant.findMany({
                where: { productId: product.id },
                select: { shopifyVariantId: true }
            })
            const existingSet = new Set(existingVariantIds.map(v => v.shopifyVariantId).filter(Boolean))

            for (const sv of sp.variants) {
                if (existingSet.has(String(sv.id))) continue

                await prisma.productVariant.create({
                    data: {
                        productId: product.id,
                        sizeMl: parseInt(sv.option1?.match(/\d+/) || '0') || 0,
                        price: parseFloat(sv.price),
                        shopifyVariantId: String(sv.id)
                    }
                })
            }
        }

        logger.info('Shopify product sync completed', { synced, skipped })
        return { synced, skipped }
    } catch (error) {
        logger.error('Shopify product sync failed', { error: error.message })
        throw error
    }
}

export const syncOrders = async () => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const response = await shopifyService.getOrders(oneDayAgo)
        const shopifyOrders = response.orders || []

        let synced = 0
        let skipped = 0

        for (const so of shopifyOrders) {
            const existing = await prisma.order.findUnique({
                where: { shopifyOrderId: String(so.id) }
            })

            if (existing) {
                skipped++
                continue
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

            const internalStatus = statusMap[so.financial_status] || statusMap[so.status] || 'NEW'

            await prisma.order.create({
                data: {
                    shopifyOrderId: String(so.id),
                    source: 'SHOPIFY',
                    customerName: `${so.shipping_address?.first_name || ''} ${so.shipping_address?.last_name || ''}`.trim(),
                    customerPhone: so.shipping_address?.phone || null,
                    customerEmail: so.email || null,
                    customerAddress: so.shipping_address?.address1 || null,
                    customerPincode: so.shipping_address?.zip || null,
                    status: internalStatus,
                    paymentStatus: so.financial_status === 'paid' ? 'PAID' : 'PENDING',
                    subtotal: parseFloat(so.subtotal_price || 0),
                    discount: parseFloat(so.total_discounts || 0),
                    total: parseFloat(so.total_price || 0),
                    tax: parseFloat(so.total_tax || 0),
                    items: {
                        create: so.line_items?.map(item => ({
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
            synced++
        }

        logger.info('Shopify order sync completed', { synced, skipped })
        return { synced, skipped }
    } catch (error) {
        logger.error('Shopify order sync failed', { error: error.message })
        throw error
    }
}
