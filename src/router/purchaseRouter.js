import { Router } from 'express'
import * as purchaseController from '../controller/purchaseController.js'

const router = Router()

router.route('/')
    .get(purchaseController.getAllPurchases)
    .post(purchaseController.createPurchase)

router.route('/:id')
    .get(purchaseController.getPurchaseById)
    .put(purchaseController.updatePurchase)
    .delete(purchaseController.deletePurchase)

export default router
