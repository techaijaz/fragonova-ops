import { Router } from 'express'
import * as rbacController from '../controller/rbacController.js'

const router = Router()

router.route('/catalog').get(rbacController.getCatalog)
router.route('/matrix')
    .get(rbacController.getMatrix)
    .put(rbacController.updateMatrix)
router.route('/matrix/reset').post(rbacController.resetMatrix)

export default router
