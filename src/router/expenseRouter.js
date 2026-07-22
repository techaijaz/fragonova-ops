import { Router } from 'express'
import * as expenseController from '../controller/expenseController.js'
import authorizeRoles from '../middleware/authorize.js'

const router = Router()

router.route('/')
    .get(expenseController.getAllExpenses)
    .post(expenseController.createExpense)

router.route('/:id')
    .get(expenseController.getExpenseById)
    .put(expenseController.updateExpense)
    .delete(authorizeRoles('admin', 'manager'), expenseController.deleteExpense)

export default router

