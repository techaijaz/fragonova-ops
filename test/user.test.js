import { jest, describe, test, expect, beforeEach, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../src/app.js'
import databaseService from '../src/service/databaseService.js'
import prisma, { connection } from '../src/config/prisma.js'

describe('User Authentication API', () => {
    let findUserSpy
    let registerUserSpy

    beforeEach(() => {
        jest.clearAllMocks()
        // Use spyOn instead of jest.mock for ESM compatibility in this setup
        findUserSpy = jest.spyOn(databaseService, 'findUserByEmail')
        registerUserSpy = jest.spyOn(databaseService, 'registerUser')
    })

    afterAll(async () => {
        jest.restoreAllMocks()
        await prisma.$disconnect()
        await connection.end()
    })

    describe('POST /api/v1/register', () => {
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            phone: '911234567890',
            password: 'password123',
            consent: true
        }

        test('should register a new user successfully', async () => {
            findUserSpy.mockResolvedValue(null)
            registerUserSpy.mockResolvedValue({
                id: 'uuid-123',
                email: 'test@example.com',
                role: 'user'
            })

            const response = await request(app)
                .post('/api/v1/register')
                .send(userData)

            expect(response.statusCode).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.data.email).toBe('test@example.com')
        })

        test('should return 422 if user already exists', async () => {
            findUserSpy.mockResolvedValue({ id: 'existing-id' })

            const response = await request(app)
                .post('/api/v1/register')
                .send(userData)

            expect(response.statusCode).toBe(422)
            expect(response.body.success).toBe(false)
        })
    })

    describe('GET /api/v1/login', () => {
        test('should return 404 for non-existent user', async () => {
            findUserSpy.mockResolvedValue(null)

            const response = await request(app)
                .get('/api/v1/login')
                .send({ email: 'wrong@example.com', password: 'password123' })

            expect(response.statusCode).toBe(404)
        })
    })
})
