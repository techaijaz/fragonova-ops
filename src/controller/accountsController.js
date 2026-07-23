import prisma from '../config/prisma.js'
import responseMessage from '../constant/phase1ResponseMessage.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import pkg from '@prisma/client'
const { Prisma } = pkg

export const getAccountsDashboard = async (req, res, next) => {
    try {
        const { range = 'today' } = req.query

        let startDate = new Date()
        if (range === 'week') {
            startDate.setDate(startDate.getDate() - 7)
        } else if (range === 'month') {
            startDate.setMonth(startDate.getMonth() - 1)
        } else if (range === 'today') {
            startDate.setHours(0, 0, 0, 0)
        } else if (range === 'custom' && req.query.startDate) {
            startDate = new Date(req.query.startDate)
        } else {
            startDate.setHours(0, 0, 0, 0)
        }

        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: { not: 'CANCELLED' }
            },
            include: {
                items: { include: { productVariant: true } },
                orderCharge: true
            }
        })

        const expensesAgg = await prisma.expense.aggregate({
            where: { expenseDate: { gte: startDate, lte: endDate } },
            _sum: { amount: true }
        })

        let cogs = 0
        for (const order of orders) {
            for (const item of order.items) {
                const sessions = await prisma.decantSession.findMany({
                    where: { productVariantId: item.productVariantId },
                    include: { sourceBatch: true }
                })
                if (sessions.length > 0) {
                    const totalCost = sessions.reduce((sum, s) => sum + (s.totalMlUsed * s.sourceBatch.costPerMl), 0)
                    const totalQty = sessions.reduce((sum, s) => sum + s.qtyProduced, 0)
                    const avgCostPerUnit = totalQty > 0 ? totalCost / totalQty : 0
                    cogs += avgCostPerUnit * item.qty
                }
            }
        }

        const revenue = orders.reduce((sum, o) => sum + o.total, 0)
        const shippingCharges = orders.reduce((sum, o) => sum + (o.orderCharge?.shippingCharge || 0), 0)
        const gatewayCharges = orders.reduce((sum, o) => sum + (o.orderCharge?.gatewayCharge || 0), 0)
        const expenses = expensesAgg._sum.amount || 0
        const netProfit = revenue - cogs - shippingCharges - gatewayCharges - expenses
        const orderCount = await prisma.order.count({ where: { createdAt: { gte: startDate, lte: endDate } } })
        const deliveredCount = await prisma.order.count({
            where: { createdAt: { gte: startDate, lte: endDate }, status: 'DELIVERED' }
        })

        httpResponse(req, res, 200, responseMessage.SUCCESS, {
            range,
            startDate,
            endDate,
            revenue,
            cogs,
            shippingCharges,
            gatewayCharges,
            expenses,
            netProfit,
            orderCount,
            deliveredCount
        })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getInventoryValuation = async (req, res, next) => {
    try {
        const batches = await prisma.sourceBatch.findMany({
            include: { product: true }
        })

        let totalValue = 0
        const valuation = batches.map(batch => {
            const usableMl = batch.totalMl - batch.wastageMl
            const value = usableMl * batch.costPerMl
            totalValue += value
            return {
                id: batch.id,
                productName: batch.product.name,
                batchNo: batch.batchNo,
                totalMl: batch.totalMl,
                wastageMl: batch.wastageMl,
                usableMl,
                costPerMl: batch.costPerMl,
                value
            }
        })

        httpResponse(req, res, 200, responseMessage.SUCCESS, {
            totalValue,
            batches: valuation
        })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getVendorLedger = async (req, res, next) => {
    try {
        const vendors = await prisma.vendor.findMany({
            include: {
                purchases: {
                    include: { sourceBatch: { include: { product: true } } }
                }
            },
            orderBy: { name: 'asc' }
        })

        const ledger = vendors.map(vendor => {
            const totalOrdered = vendor.purchases.reduce((sum, p) => sum + p.amount, 0)
            const totalPaid = vendor.purchases.reduce((sum, p) => sum + p.paidAmount, 0)
            const totalDue = vendor.purchases.reduce((sum, p) => sum + p.dueAmount, 0)
            return {
                id: vendor.id,
                name: vendor.name,
                phone: vendor.phone,
                email: vendor.email,
                totalOrdered,
                totalPaid,
                totalDue,
                purchaseCount: vendor.purchases.length
            }
        })

        const totals = ledger.reduce((acc, v) => {
            acc.totalOrdered += v.totalOrdered
            acc.totalPaid += v.totalPaid
            acc.totalDue += v.totalDue
            return acc
        }, { totalOrdered: 0, totalPaid: 0, totalDue: 0 })

        httpResponse(req, res, 200, responseMessage.SUCCESS, {
            vendors: ledger,
            totals
        })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getOrderProfit = async (req, res, next) => {
    try {
        const { id } = req.params
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { productVariant: { include: { product: true } } } },
                orderCharge: true,
                shipment: true
            }
        })
        if (!order) {
            return httpError(next, new Error(responseMessage.ORDER_NOT_FOUND), req, 404)
        }

        let cogs = 0
        for (const item of order.items) {
            const sessions = await prisma.decantSession.findMany({
                where: { productVariantId: item.productVariantId },
                include: { sourceBatch: true }
            })
            if (sessions.length > 0) {
                const totalCost = sessions.reduce((sum, s) => sum + (s.totalMlUsed * s.sourceBatch.costPerMl), 0)
                const totalQty = sessions.reduce((sum, s) => sum + s.qtyProduced, 0)
                const avgCostPerUnit = totalQty > 0 ? totalCost / totalQty : 0
                cogs += avgCostPerUnit * item.qty
            }
        }

        const shipping = order.orderCharge?.shippingCharge || order.shipment?.shippingCharge || 0
        const gateway = order.orderCharge?.gatewayCharge || 0
        const revenue = order.total
        const netProfit = revenue - cogs - shipping - gateway

        httpResponse(req, res, 200, responseMessage.SUCCESS, {
            orderId: order.id,
            orderNumber: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
            customerName: order.customerName,
            status: order.status,
            revenue,
            cogs: Math.round(cogs * 100) / 100,
            shippingCharge: shipping,
            gatewayCharge: gateway,
            netProfit: Math.round(netProfit * 100) / 100
        })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getOrderCharge = async (req, res, next) => {
    try {
        const { id } = req.params
        const charge = await prisma.orderCharge.findUnique({
            where: { orderId: id }
        })
        if (!charge) {
            return httpResponse(req, res, 200, responseMessage.SUCCESS, { shippingCharge: 0, gatewayCharge: 0 })
        }
        httpResponse(req, res, 200, responseMessage.SUCCESS, charge)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const upsertOrderCharge = async (req, res, next) => {
    try {
        const { id } = req.params
        const { shippingCharge, gatewayCharge } = req.body

        const existing = await prisma.orderCharge.findUnique({ where: { orderId: id } })
        if (existing) {
            const charge = await prisma.orderCharge.update({
                where: { orderId: id },
                data: {
                    shippingCharge: shippingCharge ?? existing.shippingCharge,
                    gatewayCharge: gatewayCharge ?? existing.gatewayCharge
                }
            })
            return httpResponse(req, res, 200, 'Order charges updated successfully', charge)
        }

        const charge = await prisma.orderCharge.create({
            data: { orderId: id, shippingCharge: shippingCharge || 0, gatewayCharge: gatewayCharge || 0 }
        })
        httpResponse(req, res, 201, 'Order charges created successfully', charge)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return httpError(next, new Error('Order not found'), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const getAllRemittances = async (req, res, next) => {
    try {
        const { status, startDate, endDate } = req.query
        const where = {}
        if (status) where.status = status
        if (startDate || endDate) {
            where.settlementDate = {}
            if (startDate) where.settlementDate.gte = new Date(startDate)
            if (endDate) where.settlementDate.lte = new Date(endDate)
        }

        const remittances = await prisma.remittance.findMany({
            where,
            include: { order: { include: { items: { include: { productVariant: { include: { product: true } } } } } } },
            orderBy: { settlementDate: 'desc' }
        })
        httpResponse(req, res, 200, responseMessage.SUCCESS, remittances)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const createRemittance = async (req, res, next) => {
    try {
        const { orderId, shiprocketSettlementId, amount, settlementDate, status } = req.body
        const remittance = await prisma.remittance.create({
            data: {
                orderId,
                shiprocketSettlementId,
                amount,
                settlementDate: new Date(settlementDate),
                status: status || 'PENDING'
            },
            include: { order: { include: { items: { include: { productVariant: { include: { product: true } } } } } } }
        })
        httpResponse(req, res, 201, 'Remittance created successfully', remittance)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return httpError(next, new Error('Order not found'), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const updateRemittance = async (req, res, next) => {
    try {
        const { id } = req.params
        const { shiprocketSettlementId, amount, settlementDate, status } = req.body
        const remittance = await prisma.remittance.update({
            where: { id },
            data: {
                shiprocketSettlementId,
                amount,
                settlementDate: settlementDate ? new Date(settlementDate) : undefined,
                status
            },
            include: { order: { include: { items: { include: { productVariant: { include: { product: true } } } } } } }
        })
        httpResponse(req, res, 200, 'Remittance updated successfully', remittance)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error('Remittance not found'), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const deleteRemittance = async (req, res, next) => {
    try {
        const { id } = req.params
        await prisma.remittance.delete({ where: { id } })
        httpResponse(req, res, 200, 'Remittance deleted successfully', null)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error('Remittance not found'), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const getProductProfit = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query
        const where = {}
        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) where.createdAt.gte = new Date(startDate)
            if (endDate) where.createdAt.lte = new Date(endDate)
        }

        const orders = await prisma.order.findMany({
            where: { ...where, status: { not: 'CANCELLED' } },
            include: {
                items: { include: { productVariant: { include: { product: true } } } },
                orderCharge: true
            }
        })

        const productMap = {}
        for (const order of orders) {
            for (const item of order.items) {
                const productName = item.productName
                if (!productMap[productName]) {
                    productMap[productName] = {
                        productName,
                        totalRevenue: 0,
                        totalCogs: 0,
                        totalShipping: 0,
                        totalGateway: 0,
                        totalQty: 0
                    }
                }

                productMap[productName].totalRevenue += item.total
                productMap[productName].totalQty += item.qty

                const sessions = await prisma.decantSession.findMany({
                    where: { productVariantId: item.productVariantId },
                    include: { sourceBatch: true }
                })
                if (sessions.length > 0) {
                    const totalCost = sessions.reduce((sum, s) => sum + (s.totalMlUsed * s.sourceBatch.costPerMl), 0)
                    const totalQty = sessions.reduce((sum, s) => sum + s.qtyProduced, 0)
                    const avgCostPerUnit = totalQty > 0 ? totalCost / totalQty : 0
                    productMap[productName].totalCogs += avgCostPerUnit * item.qty
                }
            }
        }

        const result = Object.values(productMap).map(p => ({
            ...p,
            totalCogs: Math.round(p.totalCogs * 100) / 100,
            netProfit: Math.round((p.totalRevenue - p.totalCogs - p.totalShipping - p.totalGateway) * 100) / 100
        }))

        httpResponse(req, res, 200, responseMessage.SUCCESS, result)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}
