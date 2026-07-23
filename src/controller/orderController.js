import prisma from '../config/prisma.js'
import responseMessage from '../constant/phase1ResponseMessage.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import pkg from '@prisma/client'
const { Prisma } = pkg

export const getAllOrders = async (req, res, next) => {
    try {
        const { status, source, startDate, endDate } = req.query
        const where = {}
        if (status) where.status = status
        if (source) where.source = source
        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) where.createdAt.gte = new Date(startDate)
            if (endDate) where.createdAt.lte = new Date(endDate)
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: {
                    include: {
                        productVariant: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        httpResponse(req, res, 200, responseMessage.SUCCESS, orders)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params
        const order = await prisma.order.findUnique({
            where: { id },
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
            }
        })
        if (!order) {
            return httpError(next, new Error(responseMessage.ORDER_NOT_FOUND), req, 404)
        }
        httpResponse(req, res, 200, responseMessage.SUCCESS, order)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const createOrder = async (req, res, next) => {
    try {
        const {
            source,
            customerName,
            customerPhone,
            customerEmail,
            customerAddress,
            customerPincode,
            status,
            paymentStatus,
            subtotal,
            discount,
            total,
            tax,
            notes,
            items
        } = req.body

        const order = await prisma.order.create({
            data: {
                source: source || 'MANUAL',
                customerName,
                customerPhone,
                customerEmail,
                customerAddress,
                customerPincode,
                status: status || 'NEW',
                paymentStatus: paymentStatus || 'PENDING',
                subtotal: subtotal || 0,
                discount: discount || 0,
                total: total || 0,
                tax: tax || 0,
                notes,
                items: {
                    create: items.map(item => ({
                        productVariantId: item.productVariantId,
                        productName: item.productName,
                        variantLabel: item.variantLabel,
                        qty: item.qty,
                        rate: item.rate,
                        total: item.total
                    }))
                }
            },
            include: {
                items: true
            }
        })
        httpResponse(req, res, 201, responseMessage.ORDER_CREATED, order)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params
        const { status, paymentStatus } = req.body
        const data = {}
        if (status) data.status = status
        if (paymentStatus) data.paymentStatus = paymentStatus

        const existing = await prisma.order.findUnique({
            where: { id },
            include: { items: { include: { productVariant: true } } }
        })
        if (!existing) {
            return httpError(next, new Error(responseMessage.ORDER_NOT_FOUND), req, 404)
        }

        if (status === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
            for (const item of existing.items) {
                if (!item.productVariantId) continue
                const stock = await prisma.decantStock.findUnique({
                    where: { productVariantId: item.productVariantId }
                })
                if (!stock || stock.qtyAvailable < item.qty) {
                    return httpError(next, new Error(`Insufficient stock for ${item.productName}`), req, 400)
                }
                await prisma.decantStock.update({
                    where: { productVariantId: item.productVariantId },
                    data: { qtyAvailable: stock.qtyAvailable - item.qty, lastUpdated: new Date() }
                })
            }
        }

        if ((status === 'CANCELLED' || status === 'RTO') && existing.status !== 'CANCELLED' && existing.status !== 'RTO') {
            for (const item of existing.items) {
                if (!item.productVariantId) continue
                const stock = await prisma.decantStock.findUnique({
                    where: { productVariantId: item.productVariantId }
                })
                if (stock) {
                    await prisma.decantStock.update({
                        where: { productVariantId: item.productVariantId },
                        data: { qtyAvailable: stock.qtyAvailable + item.qty, lastUpdated: new Date() }
                    })
                }
            }
        }

        const order = await prisma.order.update({
            where: { id },
            data
        })
        httpResponse(req, res, 200, responseMessage.ORDER_UPDATED, order)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error(responseMessage.ORDER_NOT_FOUND), req, 404)
        }
        httpError(next, error, req, 500)
    }
}
