import config from './config/config.js'
import app from './app.js'
import logger from './util/logger.js'
import databaseService from './service/databaseService.js'
import { initRateLimiter } from './config/rateLimiter.js'
import cron from 'node-cron'
import { syncOrders } from './service/shopifySyncService.js'

const server = app.listen(config.PORT, () => {
    logger.info('APPLICATION STARTED', {
        meta: {
            PORT: config.PORT,
            SERVER_URL: config.SERVER_URL
        }
    })
})

if (config.CRON?.RECONCILE_ORDERS_INTERVAL) {
    cron.schedule(config.CRON.RECONCILE_ORDERS_INTERVAL, async () => {
        logger.info('CRON: Starting nightly order reconciliation')
        try {
            const result = await syncOrders()
            logger.info('CRON: Order reconciliation completed', { result })
        } catch (error) {
            logger.error('CRON: Order reconciliation failed', { error: error.message })
        }
    })
    logger.info('CRON: Reconciliation job scheduled', { schedule: config.CRON.RECONCILE_ORDERS_INTERVAL })
}

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
