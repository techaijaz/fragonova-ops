import { Router } from 'express'
import * as shipmentController from '../controller/shipmentController.js'

const router = Router()

router.route('/')
    .get(shipmentController.getShipments)
    .post(shipmentController.createShipment)

router.route('/:id')
    .get(shipmentController.getShipmentById)

router.route('/:id/track')
    .get(shipmentController.trackShipment)

router.route('/:id/assign-awb')
    .post(shipmentController.assignAwb)

router.route('/:id/label')
    .get(shipmentController.generateLabel)

router.route('/:id/schedule-pickup')
    .post(shipmentController.schedulePickup)

export default router
