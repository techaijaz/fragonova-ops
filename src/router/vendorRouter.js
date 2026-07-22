import { Router } from 'express'
import * as vendorController from '../controller/vendorController.js'

const router = Router()

router.route('/')
    .get(vendorController.getAllVendors)
    .post(vendorController.createVendor)

router.route('/:id')
    .get(vendorController.getVendorById)
    .put(vendorController.updateVendor)
    .delete(vendorController.deleteVendor)

export default router
