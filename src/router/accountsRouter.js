import { Router } from 'express'
import * as accountsController from '../controller/accountsController.js'

const router = Router()

router.route('/dashboard')
    .get(accountsController.getAccountsDashboard)

router.route('/inventory/valuation')
    .get(accountsController.getInventoryValuation)

router.route('/vendors/ledger')
    .get(accountsController.getVendorLedger)

router.route('/profit/order/:orderId')
    .get(accountsController.getOrderProfit)

router.route('/profit/product')
    .get(accountsController.getProductProfit)

router.route('/remittances')
    .get(accountsController.getAllRemittances)
    .post(accountsController.createRemittance)

router.route('/remittances/:id')
    .put(accountsController.updateRemittance)
    .delete(accountsController.deleteRemittance)

export default router
