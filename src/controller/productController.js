import prisma from '../config/prisma.js'
import responseMessage from '../constant/phase1ResponseMessage.js'
import httpError from '../util/httpError.js'
import pkg from '@prisma/client'
const { Prisma } = pkg
import httpResponse from '../util/httpResponse.js'

export const getAllProducts = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                variants: true,
                sourceBatches: true,
                decantStocks: true
            },
            orderBy: { createdAt: 'desc' }
        })
        httpResponse(req, res, 200, responseMessage.SUCCESS, products)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                variants: true,
                sourceBatches: true,
                decantStocks: true
            }
        })
        if (!product) {
            return httpError(next, new Error(responseMessage.PRODUCT_NOT_FOUND), req, 404)
        }
        httpResponse(req, res, 200, responseMessage.SUCCESS, product)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const createProduct = async (req, res, next) => {
    try {
        const { name, description, category, shopifyProductId } = req.body
        const product = await prisma.product.create({
            data: {
                name,
                description,
                category,
                shopifyProductId: shopifyProductId || null
            }
        })
        httpResponse(req, res, 201, responseMessage.PRODUCT_CREATED, product)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return httpError(next, new Error('Product with this Shopify ID already exists'), req, 409)
            }
        }
        httpError(next, error, req, 500)
    }
}

export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params
        const { name, description, category, shopifyProductId } = req.body
        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                category,
                shopifyProductId
            }
        })
        httpResponse(req, res, 200, responseMessage.PRODUCT_UPDATED, product)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error(responseMessage.PRODUCT_NOT_FOUND), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params
        await prisma.product.delete({ where: { id } })
        httpResponse(req, res, 200, responseMessage.PRODUCT_DELETED, null)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error(responseMessage.PRODUCT_NOT_FOUND), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const addVariant = async (req, res, next) => {
    try {
        const { id } = req.params
        const { sizeMl, price, shopifyVariantId } = req.body
        const variant = await prisma.productVariant.create({
            data: {
                productId: id,
                sizeMl,
                price,
                shopifyVariantId: shopifyVariantId || null
            }
        })
        httpResponse(req, res, 201, responseMessage.VARIANT_CREATED, variant)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return httpError(next, new Error('Variant already exists for this size'), req, 409)
            }
            if (error.code === 'P2003') {
                return httpError(next, new Error('Product not found'), req, 404)
            }
        }
        httpError(next, error, req, 500)
    }
}

export const updateVariant = async (req, res, next) => {
    try {
        const { id } = req.params
        const { sizeMl, price, isActive, shopifyVariantId } = req.body
        const variant = await prisma.productVariant.update({
            where: { id },
            data: {
                sizeMl,
                price,
                isActive,
                shopifyVariantId
            }
        })
        httpResponse(req, res, 200, responseMessage.VARIANT_UPDATED, variant)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error(responseMessage.VARIANT_NOT_FOUND), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const deleteVariant = async (req, res, next) => {
    try {
        const { id } = req.params
        await prisma.productVariant.delete({ where: { id } })
        httpResponse(req, res, 200, responseMessage.VARIANT_DELETED, null)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error(responseMessage.VARIANT_NOT_FOUND), req, 404)
        }
        httpError(next, error, req, 500)
    }
}
