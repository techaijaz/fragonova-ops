import pkg from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import config from './config.js'

const { PrismaClient } = pkg

const adapter = new PrismaMariaDb({
    host: config.DB.HOST,
    port: parseInt(config.DB.PORT),
    user: config.DB.USER,
    password: config.DB.PASSWORD,
    database: config.DB.NAME,
    connectionLimit: 10,
    queueLimit: 100,
    connectTimeout: 30000
})

const prisma = new PrismaClient({ adapter })

export default prisma
