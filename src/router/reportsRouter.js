import { Router } from 'express'
import * as reportsController from '../controller/reportsController.js'

const router = Router()

router.route('/best-sellers')
    .get(reportsController.getBestSellers)

router.route('/margin-analysis')
    .get(reportsController.getMarginAnalysis)

router.route('/wastage')
    .get(reportsController.getWastage)

router.route('/sales-summary')
    .get(reportsController.getSalesSummary)

export default router
