import { Router } from 'express'
import * as orderController from '../controller/orderController.js'

const router = Router()

router.route('/')
    .get(orderController.getAllOrders)
    .post(orderController.createOrder)

router.route('/:id')
    .get(orderController.getOrderById)
    .patch(orderController.updateOrderStatus)

export default router
