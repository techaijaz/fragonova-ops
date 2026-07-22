import { Router } from 'express'
import * as inventoryController from '../controller/inventoryController.js'
import authorizeRoles from '../middleware/authorize.js'

const router = Router()

router.route('/batches')
    .get(inventoryController.getAllSourceBatches)
    .post(inventoryController.createSourceBatch)

router.route('/batches/:id')
    .get(inventoryController.getSourceBatchById)
    .put(inventoryController.updateSourceBatch)
    .delete(authorizeRoles('admin', 'manager'), inventoryController.deleteSourceBatch)

router.route('/stock')
    .get(inventoryController.getDecantStock)

router.route('/sessions')
    .post(inventoryController.createDecantSession)

router.route('/stats/dashboard')
    .get(inventoryController.getDashboardStats)

export default router

