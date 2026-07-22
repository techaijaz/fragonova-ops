import prisma from '../config/prisma.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import phase1ResponseMessage from '../constant/phase1ResponseMessage.js'

export const getLowStockAlerts = async (req, res, next) => {
    try {
        const lowStock = await prisma.decantStock.findMany({
            where: {
                qtyAvailable: {
                    lte: prisma.decantStock.fields.lowStockThreshold
                }
            },
            include: {
                productVariant: {
                    include: {
                        product: true
                    }
                },
                product: true
            }
        })

        const sourceBatches = await prisma.sourceBatch.findMany({
            where: {
                totalMl: {
                    lte: prisma.sourceBatch.fields.wastageMl
                }
            },
            include: {
                product: true
            }
        })

        httpResponse(req, res, 200, phase1ResponseMessage.SUCCESS, {
            decantLowStock: lowStock,
            sourceLowStock: sourceBatches
        })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getNeedsDecantingQueue = async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: 'NEEDS_DECANTING'
            },
            include: {
                items: {
                    include: {
                        productVariant: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })
        httpResponse(req, res, 200, phase1ResponseMessage.SUCCESS, orders)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todayOrders = await prisma.order.count({
            where: {
                createdAt: { gte: today }
            }
        })

        const todayRevenue = await prisma.order.aggregate({
            where: {
                createdAt: { gte: today },
                status: { not: 'CANCELLED' }
            },
            _sum: { total: true }
        })

        const pendingShipments = await prisma.order.count({
            where: { status: 'PACKED' }
        })

        const vendorDuesCount = await prisma.vendor.count()

        httpResponse(req, res, 200, phase1ResponseMessage.SUCCESS, {
            todayOrders,
            todayRevenue: todayRevenue._sum.total || 0,
            pendingShipments,
            vendorCount: vendorDuesCount
        })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}
