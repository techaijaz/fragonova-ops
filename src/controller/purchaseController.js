import prisma from '../config/prisma.js'
import responseMessage from '../constant/phase1ResponseMessage.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import pkg from '@prisma/client'
const { Prisma } = pkg

export const getAllPurchases = async (req, res, next) => {
    try {
        const { vendorId, sourceBatchId, startDate, endDate } = req.query
        const where = {}
        if (vendorId) where.vendorId = vendorId
        if (sourceBatchId) where.sourceBatchId = sourceBatchId
        if (startDate || endDate) {
            where.purchaseDate = {}
            if (startDate) where.purchaseDate.gte = new Date(startDate)
            if (endDate) where.purchaseDate.lte = new Date(endDate)
        }

        const purchases = await prisma.purchase.findMany({
            where,
            include: {
                vendor: true,
                sourceBatch: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { purchaseDate: 'desc' }
        })
        httpResponse(req, res, 200, responseMessage.SUCCESS, purchases)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getPurchaseById = async (req, res, next) => {
    try {
        const { id } = req.params
        const purchase = await prisma.purchase.findUnique({
            where: { id },
            include: {
                vendor: true,
                sourceBatch: {
                    include: {
                        product: true
                    }
                }
            }
        })
        if (!purchase) {
            return httpError(next, new Error(responseMessage.PURCHASE_NOT_FOUND), req, 404)
        }
        httpResponse(req, res, 200, responseMessage.SUCCESS, purchase)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const createPurchase = async (req, res, next) => {
    try {
        const { vendorId, sourceBatchId, amount, paidAmount, purchaseDate, notes } = req.body

        const paid = paidAmount || 0
        const due = amount - paid
        const paymentStatus = due <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING'

        const purchase = await prisma.purchase.create({
            data: {
                vendorId,
                sourceBatchId: sourceBatchId || null,
                amount,
                paidAmount: paid,
                dueAmount: due,
                paymentStatus,
                purchaseDate: new Date(purchaseDate),
                notes
            },
            include: {
                vendor: true,
                sourceBatch: {
                    include: {
                        product: true
                    }
                }
            }
        })
        httpResponse(req, res, 201, responseMessage.PURCHASE_CREATED, purchase)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                return httpError(next, new Error('Vendor or source batch not found'), req, 404)
            }
        }
        httpError(next, error, req, 500)
    }
}

export const updatePurchase = async (req, res, next) => {
    try {
        const { id } = req.params
        const { amount, paidAmount, purchaseDate, notes } = req.body

        const existing = await prisma.purchase.findUnique({ where: { id } })
        if (!existing) {
            return httpError(next, new Error(responseMessage.PURCHASE_NOT_FOUND), req, 404)
        }

        const newAmount = amount ?? existing.amount
        const newPaid = paidAmount ?? existing.paidAmount
        const due = newAmount - newPaid
        const paymentStatus = due <= 0 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'PENDING'

        const purchase = await prisma.purchase.update({
            where: { id },
            data: {
                amount: newAmount,
                paidAmount: newPaid,
                dueAmount: due,
                paymentStatus,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
                notes
            },
            include: {
                vendor: true,
                sourceBatch: {
                    include: {
                        product: true
                    }
                }
            }
        })
        httpResponse(req, res, 200, responseMessage.PURCHASE_UPDATED, purchase)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error(responseMessage.PURCHASE_NOT_FOUND), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const deletePurchase = async (req, res, next) => {
    try {
        const { id } = req.params
        await prisma.purchase.delete({ where: { id } })
        httpResponse(req, res, 200, responseMessage.PURCHASE_DELETED, null)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error(responseMessage.PURCHASE_NOT_FOUND), req, 404)
        }
        httpError(next, error, req, 500)
    }
}
