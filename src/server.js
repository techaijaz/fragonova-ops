import config from './config/config.js'
import app from './app.js'
import logger from './util/logger.js'
import databaseService from './service/databaseService.js'
import { initRateLimiter } from './config/rateLimiter.js'

const server = app.listen(config.PORT, () => {
    logger.info('APPLICATION STARTED', {
        meta: {
            PORT: config.PORT,
            SERVER_URL: config.SERVER_URL
        }
    })
})

;(async () => {
    try {
        await databaseService.connect()
        logger.info('DATABASE CONNECTION SUCCESSFUL')

        initRateLimiter()
        logger.info('RATE LIMITER INITIATE')
    } catch (error) {
        logger.error('APPLICATION START ERROR', { meta: error })
        server.close(() => {
            process.exit(1)
        })
    }
})()
