import prisma from '../config/prisma.js'
import responseMessage from '../constant/phase1ResponseMessage.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import { Prisma } from '@prisma/client'

export const getAllSourceBatches = async (req, res, next) => {
    try {
        const { productId } = req.query
        const where = {}
        if (productId) where.productId = productId

        const batches = await prisma.sourceBatch.findMany({
            where,
            include: {
                product: true,
                vendor: true
            },
            orderBy: { purchaseDate: 'desc' }
        })
        httpResponse(req, res, 200, responseMessage.SUCCESS, batches)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getSourceBatchById = async (req, res, next) => {
    try {
        const { id } = req.params
        const batch = await prisma.sourceBatch.findUnique({
            where: { id },
            include: {
                product: true,
                vendor: true,
                sessions: {
                    include: {
                        productVariant: true
                    }
                }
            }
        })
        if (!batch) {
            return httpError(next, new Error(responseMessage.SOURCE_BATCH_NOT_FOUND), req, 404)
        }
        httpResponse(req, res, 200, responseMessage.SUCCESS, batch)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const createSourceBatch = async (req, res, next) => {
    try {
        const { productId, batchNo, totalMl, wastageMl, costPerMl, vendorId, purchaseDate, notes } = req.body

        const usableMl = totalMl - (wastageMl || 0)
        const totalCost = usableMl * costPerMl

        const batch = await prisma.sourceBatch.create({
            data: {
                productId,
                batchNo,
                totalMl,
                wastageMl: wastageMl || 0,
                costPerMl,
                totalCost,
                vendorId,
                purchaseDate: new Date(purchaseDate),
                notes
            },
            include: {
                product: true,
                vendor: true
            }
        })

        if (vendorId && totalCost > 0) {
            await prisma.purchase.create({
                data: {
                    vendorId,
                    sourceBatchId: batch.id,
                    amount: totalCost,
                    paidAmount: 0,
                    dueAmount: totalCost,
                    paymentStatus: 'PENDING',
                    purchaseDate: new Date(purchaseDate),
                    notes: notes || null
                }
            })
        }

        httpResponse(req, res, 201, responseMessage.SOURCE_BATCH_CREATED, batch)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return httpError(next, new Error('Batch number already exists for this product'), req, 409)
            }
            if (error.code === 'P2003') {
                return httpError(next, new Error('Product or vendor not found'), req, 404)
            }
        }
        httpError(next, error, req, 500)
    }
}

export const updateSourceBatch = async (req, res, next) => {
    try {
        const { id } = req.params
        const { batchNo, totalMl, wastageMl, costPerMl, vendorId, purchaseDate, notes } = req.body

        const existing = await prisma.sourceBatch.findUnique({ where: { id } })
        if (!existing) {
            return httpError(next, new Error(responseMessage.SOURCE_BATCH_NOT_FOUND), req, 404)
        }

        const usableMl = totalMl - (wastageMl || 0)
        const totalCost = usableMl * costPerMl

        const batch = await prisma.sourceBatch.update({
            where: { id },
            data: {
                batchNo,
                totalMl,
                wastageMl: wastageMl || 0,
                costPerMl,
                totalCost,
                vendorId,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
                notes
            },
            include: {
                product: true,
                vendor: true
            }
        })
        httpResponse(req, res, 200, responseMessage.SOURCE_BATCH_UPDATED, batch)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error(responseMessage.SOURCE_BATCH_NOT_FOUND), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const deleteSourceBatch = async (req, res, next) => {
    try {
        const { id } = req.params
        await prisma.sourceBatch.delete({ where: { id } })
        httpResponse(req, res, 200, responseMessage.SOURCE_BATCH_DELETED, null)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error(responseMessage.SOURCE_BATCH_NOT_FOUND), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const getDecantStock = async (req, res, next) => {
    try {
        const { productId } = req.query
        const where = {}
        if (productId) where.productId = productId

        const stocks = await prisma.decantStock.findMany({
            where,
            include: {
                productVariant: {
                    include: {
                        product: true
                    }
                },
                product: true
            }
        })
        httpResponse(req, res, 200, responseMessage.SUCCESS, stocks)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const createDecantSession = async (req, res, next) => {
    try {
        const { sourceBatchId, productVariantId, qtyProduced, mlPerUnit, wastageMl } = req.body

        const batch = await prisma.sourceBatch.findUnique({
            where: { id: sourceBatchId },
            include: { product: true }
        })
        if (!batch) {
            return httpError(next, new Error(responseMessage.SOURCE_BATCH_NOT_FOUND), req, 404)
        }

        const variant = await prisma.productVariant.findUnique({
            where: { id: productVariantId }
        })
        if (!variant) {
            return httpError(next, new Error(responseMessage.VARIANT_NOT_FOUND), req, 404)
        }

        const totalMlUsed = qtyProduced * mlPerUnit
        const usableMl = batch.totalMl - batch.wastageMl

        if (totalMlUsed > usableMl) {
            return httpError(next, new Error(responseMessage.INSUFFICIENT_SOURCE_ML), req, 400)
        }

        const session = await prisma.decantSession.create({
            data: {
                sourceBatchId,
                productVariantId,
                qtyProduced,
                mlPerUnit,
                wastageMl: wastageMl || 0,
                totalMlUsed
            }
        })

        const newWastage = batch.wastageMl + totalMlUsed + (wastageMl || 0)
        await prisma.sourceBatch.update({
            where: { id: sourceBatchId },
            data: {
                totalMl: batch.totalMl,
                wastageMl: newWastage > batch.totalMl ? batch.totalMl : newWastage
            }
        })

        let stock = await prisma.decantStock.findUnique({
            where: { productVariantId }
        })

        if (!stock) {
            stock = await prisma.decantStock.create({
                data: {
                    productVariantId,
                    productId: variant.productId,
                    totalMl: totalMlUsed,
                    qtyAvailable: qtyProduced,
                    lowStockThreshold: 5
                }
            })
        } else {
            stock = await prisma.decantStock.update({
                where: { productVariantId },
                data: {
                    totalMl: stock.totalMl + totalMlUsed,
                    qtyAvailable: stock.qtyAvailable + qtyProduced,
                    lastUpdated: new Date()
                }
            })
        }

        httpResponse(req, res, 201, responseMessage.DECANT_SESSION_CREATED, { session, stock })
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

        httpResponse(req, res, 200, responseMessage.SUCCESS, {
            todayOrders,
            todayRevenue: todayRevenue._sum.total || 0,
            pendingShipments,
            vendorCount: vendorDuesCount
        })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}
