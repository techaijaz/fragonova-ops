import prisma from '../config/prisma.js'
import responseMessage from '../constant/phase1ResponseMessage.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import { Prisma } from '@prisma/client'

export const getAllExpenses = async (req, res, next) => {
    try {
        const { category, startDate, endDate } = req.query
        const where = {}
        if (category) where.category = category
        if (startDate || endDate) {
            where.expenseDate = {}
            if (startDate) where.expenseDate.gte = new Date(startDate)
            if (endDate) where.expenseDate.lte = new Date(endDate)
        }

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { expenseDate: 'desc' }
        })
        httpResponse(req, res, 200, responseMessage.SUCCESS, expenses)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getExpenseById = async (req, res, next) => {
    try {
        const { id } = req.params
        const expense = await prisma.expense.findUnique({ where: { id } })
        if (!expense) {
            return httpError(next, new Error('Expense not found'), req, 404)
        }
        httpResponse(req, res, 200, responseMessage.SUCCESS, expense)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const createExpense = async (req, res, next) => {
    try {
        const { category, amount, expenseDate, notes } = req.body
        const expense = await prisma.expense.create({
            data: {
                category,
                amount,
                expenseDate: new Date(expenseDate),
                notes
            }
        })
        httpResponse(req, res, 201, 'Expense created successfully', expense)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const updateExpense = async (req, res, next) => {
    try {
        const { id } = req.params
        const { category, amount, expenseDate, notes } = req.body
        const expense = await prisma.expense.update({
            where: { id },
            data: {
                category,
                amount,
                expenseDate: expenseDate ? new Date(expenseDate) : undefined,
                notes
            }
        })
        httpResponse(req, res, 200, 'Expense updated successfully', expense)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error('Expense not found'), req, 404)
        }
        httpError(next, error, req, 500)
    }
}

export const deleteExpense = async (req, res, next) => {
    try {
        const { id } = req.params
        await prisma.expense.delete({ where: { id } })
        httpResponse(req, res, 200, 'Expense deleted successfully', null)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpError(next, new Error('Expense not found'), req, 404)
        }
        httpError(next, error, req, 500)
    }
}
