import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import mysql from 'mysql2/promise'
import config from './config.js'

const connection = mysql.createPool({
    host: config.DB.HOST,
    port: config.DB.PORT,
    user: config.DB.USER,
    password: config.DB.PASSWORD,
    database: config.DB.NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

const adapter = new PrismaMariaDb(connection)
const prisma = new PrismaClient({ adapter })

export { connection }
export default prisma
