import config from '../config/config.js'
import https from 'https'

export default {
    async request(endpoint, options = {}) {
        const url = new URL(`https://${config.SHOPIFY.STORE_URL}/admin/api/${config.SHOPIFY.ADMIN_API_VERSION}${endpoint}`)
        const reqOptions = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: {
                'X-Shopify-Access-Token': config.SHOPIFY.ACCESS_TOKEN,
                'Content-Type': 'application/json',
                ...options.headers
            }
        }

        return new Promise((resolve, reject) => {
            const req = https.request(reqOptions, (res) => {
                let data = ''
                res.on('data', (chunk) => { data += chunk })
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data)
                        if (res.statusCode >= 400) {
                            reject(new Error(parsed.errors || data))
                        } else {
                            resolve(parsed)
                        }
                    } catch {
                        resolve(data)
                    }
                })
            })
            req.on('error', reject)
            if (options.body) {
                req.write(JSON.stringify(options.body))
            }
            req.end()
        })
    },

    async getProducts() {
        return this.request('/products.json?limit=250')
    },

    async getProduct(id) {
        return this.request(`/products/${id}.json`)
    },

    async getOrders(updatedAtMin) {
        const params = updatedAtMin ? `?updated_at_min=${updatedAtMin}&status=any&limit=250` : '?status=any&limit=250'
        return this.request(`/orders.json${params}`, { method: 'GET' })
    },

    async getOrder(id) {
        return this.request(`/orders/${id}.json`)
    }
}
