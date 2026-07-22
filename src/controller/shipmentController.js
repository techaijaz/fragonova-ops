import prisma from '../config/prisma.js'
import responseMessage from '../constant/phase1ResponseMessage.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import shiprocketService from '../service/shiprocketService.js'
import config from '../config/config.js'

const TRACKING_STATUS_MAP = {
    'Out for delivery': 'OUT_FOR_DELIVERY',
    'Delivered': 'DELIVERED',
    'RTO': 'RTO',
    'RTO Delivered': 'RTO_DELIVERED',
    'Picked up': 'PICKED_UP',
    'In Transit': 'IN_TRANSIT',
    'Booked': 'CREATED',
    'Dispatched': 'IN_TRANSIT'
}

export const createShipment = async (req, res, next) => {
    try {
        const { orderId } = req.body

        const order = await prisma.order.findUnique({
            where: { id: orderId },
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

        if (!order) {
            return httpError(next, new Error(responseMessage.ORDER_NOT_FOUND), req, 404)
        }

        if (['SHIPPED', 'DELIVERED', 'RTO'].includes(order.status)) {
            return httpError(next, new Error('Order is already shipped or delivered'), req, 400)
        }

        const existing = await prisma.shipment.findUnique({ where: { orderId } })
        if (existing) {
            return httpError(next, new Error(responseMessage.SHIPMENT_ALREADY_EXISTS), req, 400)
        }

        const totalWeight = order.items.reduce((sum, item) => sum + (item.qty * 0.5), 0) || 0.5
        const pickupCity = config.SHIPROCKET.PICKUP_CITY || 'New Delhi'
        const pickupState = config.SHIPROCKET.PICKUP_STATE || 'Delhi'

        const srPayload = {
            order_id: Date.now(),
            channel_id: config.SHIPROCKET.CHANNEL_ID || undefined,
            billing_address: {
                name: order.customerName,
                phone: order.customerPhone || '',
                email: order.customerEmail || '',
                address: order.customerAddress || '',
                city: pickupCity,
                state: pickupState,
                country: config.SHIPROCKET.PICKUP_COUNTRY || 'India',
                pincode: order.customerPincode || ''
            },
            shipping_address: {
                name: order.customerName,
                phone: order.customerPhone || '',
                email: order.customerEmail || '',
                address: order.customerAddress || '',
                city: pickupCity,
                state: pickupState,
                country: config.SHIPROCKET.PICKUP_COUNTRY || 'India',
                pincode: order.customerPincode || ''
            },
            order_items: order.items.map(item => ({
                name: item.productName,
                sku: item.variantLabel,
                units: item.qty,
                selling_price: item.rate
            })),
            payment_method: ['PAID', 'PARTIAL'].includes(order.paymentStatus) ? 'Prepaid' : 'COD',
            sub_total: order.subtotal,
            total: order.total,
            weight: totalWeight
        }

        const shipmentData = await shiprocketService.createShipment(srPayload)

        const shipment = await prisma.shipment.create({
            data: {
                orderId,
                channelOrderId: Math.floor(Math.random() * 100000000),
                shiprocketOrderId: shipmentData.id || shipmentData.shipment_id,
                status: 'CREATED',
                weight: totalWeight,
                shippingCharge: shipmentData.shipping_charge || 0,
                shippingAddress: {
                    name: order.customerName,
                    phone: order.customerPhone,
                    address: order.customerAddress,
                    pincode: order.customerPincode
                }
            }
        })

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: 'PACKED' }
        })

        httpResponse(req, res, 201, responseMessage.SHIPMENT_CREATED, { shipment, order: updatedOrder })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const assignAwb = async (req, res, next) => {
    try {
        const { id } = req.params

        const shipment = await prisma.shipment.findUnique({ where: { id } })
        if (!shipment) {
            return httpError(next, new Error(responseMessage.SHIPMENT_NOT_FOUND), req, 404)
        }

        if (shipment.awb) {
            return httpResponse(req, res, 200, 'AWB already assigned', shipment)
        }

        const result = await shiprocketService.assignAwb(shipment.shiprocketOrderId || shipment.id)

        const awbNumber = result.awb_code || result.awb || result.tracking_number
        const updated = await prisma.shipment.update({
            where: { id },
            data: {
                awb: awbNumber,
                status: 'AWB_ASSIGNED',
                courierCompanyId: result.courier_company_id,
                courierName: result.courier_name,
                trackingUrl: `https://www.shiprocket.in/tracking/${awbNumber}`
            }
        })

        await prisma.order.update({
            where: { id: shipment.orderId },
            data: { status: 'SHIPPED' }
        })

        httpResponse(req, res, 200, responseMessage.AWB_ASSIGNED, updated)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const trackShipment = async (req, res, next) => {
    try {
        const { id } = req.params

        const shipment = await prisma.shipment.findUnique({ where: { id } })
        if (!shipment || !shipment.awb) {
            return httpError(next, new Error('Shipment or AWB not found'), req, 404)
        }

        const trackData = await shiprocketService.trackByAwb(shipment.awb)

        let currentStatus = 'IN_TRANSIT'
        const trackingHistory = []

        if (trackData.tracking?.shipment_track_activities) {
            const activities = trackData.tracking.shipment_track_activities
            activities.forEach(activity => {
                trackingHistory.push({
                    date: activity.date,
                    status: activity.status,
                    activity: activity.activity,
                    location: activity.location || 'N/A'
                })
            })
            if (activities.length > 0) {
                currentStatus = TRACKING_STATUS_MAP[activities[0].status] || 'IN_TRANSIT'
            }
        }

        const updated = await prisma.shipment.update({
            where: { id },
            data: { status: currentStatus }
        })

        if (trackData.tracking?.shipment_status === 'Delivered') {
            await prisma.order.update({
                where: { id: shipment.orderId },
                data: { status: 'DELIVERED' }
            })
        }
        if (trackData.tracking?.shipment_status === 'RTO' || trackData.tracking?.current_status === 'RTO') {
            await prisma.order.update({
                where: { id: shipment.orderId },
                data: { status: 'RTO' }
            })
        }

        httpResponse(req, res, 200, responseMessage.TRACKING_UPDATED, { shipment: updated, tracking: { history: trackingHistory, current: trackData } })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const generateLabel = async (req, res, next) => {
    try {
        const { id } = req.params
        const shipment = await prisma.shipment.findUnique({ where: { id } })
        if (!shipment || !shipment.awb) {
            return httpError(next, new Error('Shipment or AWB not found'), req, 404)
        }

        const labelData = await shiprocketService.generateLabel(shipment.awb)
        const updated = await prisma.shipment.update({
            where: { id },
            data: { labelUrl: labelData.label_url || labelData.label }
        })

        httpResponse(req, res, 200, 'Label generated', updated)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getShipments = async (req, res, next) => {
    try {
        const { orderId, awb, status } = req.query
        const where = {}
        if (orderId) where.orderId = orderId
        if (awb) where.awb = awb
        if (status) where.status = status

        const shipments = await prisma.shipment.findMany({
            where,
            include: {
                order: {
                    include: {
                        items: {
                            include: { productVariant: { include: { product: true } } }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        httpResponse(req, res, 200, responseMessage.SUCCESS, shipments)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getShipmentById = async (req, res, next) => {
    try {
        const { id } = req.params
        const shipment = await prisma.shipment.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        items: {
                            include: { productVariant: { include: { product: true } } }
                        }
                    }
                }
            }
        })
        if (!shipment) {
            return httpError(next, new Error(responseMessage.SHIPMENT_NOT_FOUND), req, 404)
        }
        httpResponse(req, res, 200, responseMessage.SUCCESS, shipment)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const schedulePickup = async (req, res, next) => {
    try {
        const { id } = req.params
        const { pickupDate } = req.body

        const shipment = await prisma.shipment.findUnique({ where: { id } })
        if (!shipment) {
            return httpError(next, new Error(responseMessage.SHIPMENT_NOT_FOUND), req, 404)
        }

        if (!shipment.awb) {
            return httpError(next, new Error('AWB not assigned yet'), req, 400)
        }

        const pickup = await shiprocketService.request('/courier/generate/pickup', {
            method: 'POST',
            body: {
                shipment_id: shipment.shiprocketOrderId || shipment.id,
                pickup_date: pickupDate || new Date().toISOString().split('T')[0]
            }
        })

        const updated = await prisma.shipment.update({
            where: { id },
            data: {
                pickupScheduled: true,
                pickupDate: pickupDate ? new Date(pickupDate) : new Date()
            }
        })

        httpResponse(req, res, 200, 'Pickup scheduled', { shipment: updated, pickup })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}
