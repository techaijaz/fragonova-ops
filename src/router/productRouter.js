import { Router } from 'express'
import * as productController from '../controller/productController.js'
import authorizeRoles from '../middleware/authorize.js'

const router = Router()

router.route('/')
    .get(productController.getAllProducts)
    .post(productController.createProduct)

router.route('/:id')
    .get(productController.getProductById)
    .put(productController.updateProduct)
    .delete(authorizeRoles('admin', 'manager'), productController.deleteProduct)

router.route('/:id/variants')
    .post(productController.addVariant)

router.route('/variants/:id')
    .put(productController.updateVariant)
    .delete(authorizeRoles('admin', 'manager'), productController.deleteVariant)

export default router

