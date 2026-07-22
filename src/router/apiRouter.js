import { Router } from 'express'
import apiController from '../controller/apiController.js'
import rateLimit from '../middleware/rateLimit.js'
import userController from '../controller/userController.js'
import authentication from '../middleware/authentication.js'
import authorizeRoles from '../middleware/authorize.js'
import productRouter from './productRouter.js'
import orderRouter from './orderRouter.js'
import inventoryRouter from './inventoryRouter.js'
import vendorRouter from './vendorRouter.js'
import purchaseRouter from './purchaseRouter.js'
import shipmentRouter from './shipmentRouter.js'
import expenseRouter from './expenseRouter.js'
import accountsRouter from './accountsRouter.js'
import reportsRouter from './reportsRouter.js'
import * as accountsController from '../controller/accountsController.js'
import * as webhookController from '../controller/webhookController.js'
import { syncProducts, syncOrders } from '../service/shopifySyncService.js'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'

const router = Router()

router.use(rateLimit)
router.route('/').get((req, res) => {
    res.status(200).json({ message: 'API is working!' })
})
router.route('/self').get(apiController.self)
router.route('/health').get(apiController.health)

// User auth routes (public / unauthenticated)
router.route('/register').post(userController.register)
router.route('/confirmation/:token').put(userController.confirmation)
router.route('/login').post(userController.login)
router.route('/refresh-token').post(userController.refreshToken)
router.route('/forgot-password').put(userController.forgotPassword)
router.route('/reset-password/:token').put(userController.resetPassword)

// User auth routes (authenticated)
router.route('/self-identification').get(authentication, userController.selfIdentification)
router.route('/logout').put(authentication, userController.logout)
router.route('/change-password').put(authentication, userController.changePassword)

// Operational routes (Admin, Manager, User accessible)
router.use('/products', authentication, authorizeRoles('admin', 'manager', 'user'), productRouter)
router.use('/orders', authentication, authorizeRoles('admin', 'manager', 'user'), orderRouter)
router.use('/inventory', authentication, authorizeRoles('admin', 'manager', 'user'), inventoryRouter)
router.use('/shipments', authentication, authorizeRoles('admin', 'manager', 'user'), shipmentRouter)
router.use('/expenses', authentication, authorizeRoles('admin', 'manager', 'user'), expenseRouter)

// Admin-only routes (Vendor, Accounts, Reports, Purchases)
router.use('/vendors', authentication, authorizeRoles('admin'), vendorRouter)
router.use('/purchases', authentication, authorizeRoles('admin'), purchaseRouter)
router.use('/accounts', authentication, authorizeRoles('admin'), accountsRouter)
router.use('/reports', authentication, authorizeRoles('admin'), reportsRouter)
router.route('/orders/:id/charges')
    .get(authentication, authorizeRoles('admin'), accountsController.getOrderCharge)
    .put(authentication, authorizeRoles('admin'), accountsController.upsertOrderCharge)

// Shopify sync (Admin only)
router.route('/shopify/sync/products')
    .post(authentication, authorizeRoles('admin'), async (req, res, next) => {
        try {
            const result = await syncProducts()
            httpResponse(req, res, 200, 'Shopify product sync completed', result)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    })

router.route('/shopify/sync/orders')
    .post(authentication, authorizeRoles('admin'), async (req, res, next) => {
        try {
            const result = await syncOrders()
            httpResponse(req, res, 200, 'Shopify order sync completed', result)
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

