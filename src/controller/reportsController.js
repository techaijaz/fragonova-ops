import prisma from '../config/prisma.js'
import responseMessage from '../constant/phase1ResponseMessage.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'

const getDefaultDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    return { startDate, endDate }
}

const parseDate = (val, fallback) => {
    const d = new Date(val)
    return val && !isNaN(d.getTime()) ? d : fallback
}

export const getBestSellers = async (req, res, next) => {
    try {
        const { startDate, endDate, type } = req.query
        const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDateRange()
        const from = parseDate(startDate, defaultStart)
        const to = parseDate(endDate, defaultEnd)
        const reportType = type === 'variant' ? 'variant' : 'product'

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: from, lte: to },
                status: { not: 'CANCELLED' }
            },
            include: {
                items: {
                    include: {
                        productVariant: {
                            include: { product: true }
                        }
                    }
                }
            }
        })

        const map = new Map()
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = reportType === 'variant' ? item.productVariantId : item.productName
                const label = reportType === 'variant'
                    ? `${item.productVariant.product.name} (${item.productVariant.sizeMl}ml)`
                    : item.productName

                if (!map.has(key)) {
                    map.set(key, { name: label, revenue: 0, qty: 0, orders: new Set() })
                }
                const entry = map.get(key)
                entry.revenue += item.total
                entry.qty += item.qty
                entry.orders.add(order.id)
            })
        })

        const result = Array.from(map.values()).map(e => ({
            name: e.name,
            revenue: e.revenue,
            qty: e.qty,
            orderCount: e.orders.size
        })).sort((a, b) => b.revenue - a.revenue)

        httpResponse(req, res, 200, responseMessage.SUCCESS, result)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getMarginAnalysis = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query
        const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDateRange()
        const from = parseDate(startDate, defaultStart)
        const to = parseDate(endDate, defaultEnd)

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: from, lte: to },
                status: { not: 'CANCELLED' }
            },
            include: {
                items: {
                    include: {
                        productVariant: true
                    }
                }
            }
        })

        const productMap = {}
        for (const order of orders) {
            for (const item of order.items) {
                const name = item.productName
                if (!productMap[name]) {
                    productMap[name] = { name, revenue: 0, qty: 0, cogs: 0 }
                }
                productMap[name].revenue += item.total
                productMap[name].qty += item.qty

                const sessions = await prisma.decantSession.findMany({
                    where: { productVariantId: item.productVariantId },
                    include: { sourceBatch: true }
                })
                if (sessions.length > 0) {
                    const totalCost = sessions.reduce((sum, s) => sum + (s.totalMlUsed * s.sourceBatch.costPerMl), 0)
                    const totalQty = sessions.reduce((sum, s) => sum + s.qtyProduced, 0)
                    const avgCostPerUnit = totalQty > 0 ? totalCost / totalQty : 0
                    productMap[name].cogs += avgCostPerUnit * item.qty
                }
            }
        }

        const result = Object.values(productMap).map(p => ({
            name: p.name,
            qtySold: p.qty,
            revenue: Math.round(p.revenue * 100) / 100,
            cogs: Math.round(p.cogs * 100) / 100,
            margin: Math.round((p.revenue - p.cogs) * 100) / 100,
            marginPct: p.revenue > 0 ? parseFloat(((p.revenue - p.cogs) / p.revenue * 100).toFixed(2)) : 0
        }))

        httpResponse(req, res, 200, responseMessage.SUCCESS, result)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getWastage = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query
        const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDateRange()
        const from = parseDate(startDate, defaultStart)
        const to = parseDate(endDate, defaultEnd)

        const sessions = await prisma.decantSession.findMany({
            where: {
                createdAt: { gte: from, lte: to }
            },
            include: {
                sourceBatch: {
                    include: { product: true }
                },
                productVariant: true
            }
        })

        const map = {}
        for (const s of sessions) {
            const key = s.sourceBatchId
            if (!map[key]) {
                map[key] = {
                    batchId: s.sourceBatchId,
                    productName: s.sourceBatch.product.name,
                    batchNo: s.sourceBatch.batchNo,
                    totalMlUsed: 0,
                    totalWastageMl: 0,
                    sessionCount: 0
                }
            }
            map[key].totalMlUsed += s.totalMlUsed
            map[key].totalWastageMl += s.wastageMl
            map[key].sessionCount += 1
        }

        const result = Object.values(map).map(e => ({
            ...e,
            wastagePct: e.totalMlUsed > 0 ? parseFloat(((e.totalWastageMl / (e.totalMlUsed + e.totalWastageMl)) * 100).toFixed(2)) : 0
        }))

        httpResponse(req, res, 200, responseMessage.SUCCESS, result)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getSalesSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query
        const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDateRange()
        const from = parseDate(startDate, defaultStart)
        const to = parseDate(endDate, defaultEnd)

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: from, lte: to },
                status: { not: 'CANCELLED' }
            },
            orderBy: { createdAt: 'asc' }
        })

        const dayMap = {}
        for (const o of orders) {
            const dateStr = new Date(o.createdAt).toISOString().split('T')[0]
            if (!dayMap[dateStr]) {
                dayMap[dateStr] = { date: dateStr, orders: 0, revenue: 0 }
            }
            dayMap[dateStr].orders += 1
            dayMap[dateStr].revenue += o.total
        }

        const result = Object.values(dayMap).map(d => ({
            date: d.date,
            orders: d.orders,
            revenue: Math.round(d.revenue * 100) / 100,
            avgOrderValue: d.orders > 0 ? Math.round((d.revenue / d.orders) * 100) / 100 : 0
        }))

        httpResponse(req, res, 200, responseMessage.SUCCESS, result)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}
