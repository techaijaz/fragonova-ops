import { Router } from 'express'
import apiController from '../controller/apiController.js'
import rateLimit from '../middleware/rateLimit.js'
import userController from '../controller/userController.js'
import authentication from '../middleware/authentication.js'
import productRouter from './productRouter.js'
import orderRouter from './orderRouter.js'
import inventoryRouter from './inventoryRouter.js'
import vendorRouter from './vendorRouter.js'
import purchaseRouter from './purchaseRouter.js'
import shipmentRouter from './shipmentRouter.js'
import * as webhookController from '../controller/webhookController.js'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'

const router = Router()

router.use(rateLimit)
router.route('/').get((req, res) => {
    res.status(200).json({ message: 'API is working!' })
})
router.route('/self').get(apiController.self)

router.route('/health').get(apiController.health)

// User router
router.route('/register').post(userController.register)
router.route('/confirmation/:token').put(userController.confirmation)
router.route('/login').get(userController.login)
router.route('/self-identification').get(authentication, userController.selfIdentification)
router.route('/logout').put(authentication, userController.logout)
router.route('/refresh-token').post(userController.refreshToken)
router.route('/forgot-password').put(userController.forgotPassword)
router.route('/reset-password/:token').put(userController.resetPassword)
router.route('/change-password').put(authentication, userController.changePassword)

// Phase 1 routes
router.use('/products', productRouter)
router.use('/orders', orderRouter)
router.use('/inventory', inventoryRouter)
router.use('/vendors', vendorRouter)
router.use('/purchases', purchaseRouter)

// Phase 2 routes
router.use('/shipments', shipmentRouter)

// Phase 3 routes
import expenseRouter from './expenseRouter.js'
import accountsRouter from './accountsRouter.js'
import * as accountsController from '../controller/accountsController.js'
import reportsRouter from './reportsRouter.js'
router.use('/expenses', expenseRouter)
router.use('/accounts', accountsRouter)
router.use('/reports', reportsRouter)
router.route('/orders/:id/charges')
    .get(accountsController.getOrderCharge)
    .put(accountsController.upsertOrderCharge)

// Shopify sync
import { syncProducts } from '../service/shopifySyncService.js'
router.route('/shopify/sync/products')
    .post(async (req, res, next) => {
        try {
            const result = await syncProducts()
            httpResponse(req, res, 200, 'Shopify product sync completed', result)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    })

// Shopify webhooks
router.route('/webhooks/shopify/orders/create')
    .post(webhookController.handleOrdersCreate)
router.route('/webhooks/shopify/orders/updated')
    .post(webhookController.handleOrdersUpdated)
router.route('/webhooks/shopify/orders/cancelled')
    .post(webhookController.handleOrdersCancelled)

export default router
