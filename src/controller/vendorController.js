import prisma from '../config/prisma.js'
import responseMessage from '../constant/phase1ResponseMessage.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import pkg from '@prisma/client'
const { Prisma } = pkg

export const getAllVendors = async (req, res, next) => {
    try {
        const vendors = await prisma.vendor.findMany({
            include: {
                _count: { select: { sourceBatches: true } }
            },
            orderBy: { name: 'asc' }
        })
        httpResponse(req, res, 200, responseMessage.SUCCESS, vendors)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getVendorById = async (req, res, next) => {
    try {
        const { id } = req.params
        const vendor = await prisma.vendor.findUnique({
            where: { id },
            include: {
                sourceBatches: {
                    include: {
                        product: true
                    }
                }
            }
        })
        if (!vendor) {
            return httpError(next, new Error(responseMessage.VENDOR_NOT_FOUND), req, 404)
        }
        httpResponse(req, res, 200, responseMessage.SUCCESS, vendor)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const createVendor = async (req, res, next) => {
    try {
        const { name, phone, email, address, notes } = req.body
        const vendor = await prisma.vendor.create({
            data: {
                name,
                phone,
                email,
                address,
                notes
            }
        })
        httpResponse(req, res, 201, responseMessage.VENDOR_CREATED, vendor)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const updateVendor = async (req, res, next) => {
    try {
        const { id } = req.params
        const { name, phone, email, address, notes } = req.body
        const vendor = await prisma.vendor.update({
            where: { id },
            data: {
                name,
                phone,
                email,
                address,
                notes
            }
        })
        httpResponse(req, res, 200, responseMessage.VENDOR_UPDATED, vendor)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error(responseMessage.VENDOR_NOT_FOUND), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const deleteVendor = async (req, res, next) => {
    try {
        const { id } = req.params
        await prisma.vendor.delete({ where: { id } })
        httpResponse(req, res, 200, responseMessage.VENDOR_DELETED, null)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error(responseMessage.VENDOR_NOT_FOUND), req, 404)
        }
        httpError(next, error, req, 500)
    }
}
