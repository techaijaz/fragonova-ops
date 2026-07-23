import dotenvFlow from 'dotenv-flow'

if (process.env.NODE_ENV !== 'production') {
    try {
        dotenvFlow.config()
    } catch {
        // Local only — Railway injects env vars directly
    }
}

export default {
    // General
    ENV: process.env.NODE_ENV,
    PORT: process.env.PORT || 8080,
    SERVER_URL: process.env.SERVER_URL,

    // Database
    DB: {
        HOST: process.env.DB_HOST || 'localhost',
        PORT: process.env.DB_PORT || 3306,
        USER: process.env.DB_USER || 'root',
        PASSWORD: process.env.DB_PASSWORD || '',
        NAME: process.env.DB_NAME || 'auth_system'
    },

    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL,

    // Email service
    EMAIL_SERVICE_API_KEY: process.env.EMAIL_SERVICE_API_KEY,

    // Access Token
    ACCESS_TOKEN: {
        SECRET: process.env.ACCESS_TOKEN_SECRET,
        EXPIRY: 3600
    },

    // Refresh Token
    REFRESH_TOKEN: {
        SECRET: process.env.REFRESH_TOKEN_SECRET,
        EXPIRY: 3600 * 24
    },

    // Shopify
    SHOPIFY: {
        STORE_URL: process.env.SHOPIFY_STORE_URL,
        ADMIN_API_VERSION: process.env.SHOPIFY_ADMIN_API_VERSION || '2024-04',
        ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,
        WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET
    },

    // ShipRocket
    SHIPROCKET: {
        EMAIL: process.env.SHIPROCKET_EMAIL,
        PASSWORD: process.env.SHIPROCKET_PASSWORD,
        CHANNEL_ID: process.env.SHIPROCKET_CHANNEL_ID ? parseInt(process.env.SHIPROCKET_CHANNEL_ID) : null,
        PICKUP_POSTCODE: process.env.SHIPROCKET_PICKUP_POSTCODE || '110001',
        PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
        PICKUP_NAME: process.env.SHIPROCKET_PICKUP_NAME || 'Fragrance Decant',
        PICKUP_PHONE: process.env.SHIPROCKET_PICKUP_PHONE || '9999999999',
        PICKUP_ADDRESS: process.env.SHIPROCKET_PICKUP_ADDRESS || 'Not Set',
        PICKUP_CITY: process.env.SHIPROCKET_PICKUP_CITY || 'New Delhi',
        PICKUP_STATE: process.env.SHIPROCKET_PICKUP_STATE || 'Delhi',
        PICKUP_COUNTRY: process.env.SHIPROCKET_PICKUP_COUNTRY || 'India'
    },

    // Cron
    CRON: {
        RECONCILE_ORDERS_INTERVAL: process.env.CRON_RECONCILE_ORDERS_INTERVAL || '0 2 * * *'
    }
}
