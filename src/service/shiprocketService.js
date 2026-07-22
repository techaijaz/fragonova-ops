import config from '../config/config.js'
import https from 'https'

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external'

let tokenData = null

async function login() {
    const body = JSON.stringify({
        email: config.SHIPROCKET.EMAIL,
        password: config.SHIPROCKET.PASSWORD
    })

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'apiv2.shiprocket.in',
            path: '/v1/external/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data)
                    if (res.statusCode >= 400 || !parsed.token) {
                        return reject(new Error(parsed.message || 'ShipRocket login failed'))
                    }
                    tokenData = {
                        token: parsed.token,
                        expiry: Date.now() + (8 * 24 * 60 * 60 * 1000)
                    }
                    resolve(tokenData.token)
                } catch {
                    reject(new Error('Failed to parse ShipRocket response'))
                }
            })
        })
        req.on('error', reject)
        req.write(body)
        req.end()
    })
}

async function getToken() {
    if (!tokenData || Date.now() >= tokenData.expiry) {
        await login()
    }
    return tokenData.token
}

async function makeRequest(endpoint, options = {}, retryCount = 0) {
    const authToken = await getToken()
    const url = new URL(endpoint, BASE_URL)

    const reqOptions = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    }

    reqOptions.headers['Authorization'] = `Bearer ${authToken}`

    let body = null
    if (options.body) {
        body = JSON.stringify(options.body)
        reqOptions.headers['Content-Length'] = Buffer.byteLength(body)
    }

    return new Promise((resolve, reject) => {
        const req = https.request(reqOptions, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data)
                    if (res.statusCode >= 400) {
                        if (res.statusCode === 401 && retryCount === 0) {
                            tokenData = null
                            return makeRequest(endpoint, options, 1)
                                .then(resolve)
                                .catch(reject)
                        }
                        return reject(new Error(parsed.message || parsed.errors || data))
                    }
                    resolve(parsed)
                } catch {
                    resolve(data)
                }
            })
        })
        req.on('error', reject)
        if (body) req.write(body)
        req.end()
    })
}

export default {
    createShipment(payload) {
        return makeRequest('/orders/create/adhoc', {
            method: 'POST',
            body: payload
        })
    },

    assignAwb(shipmentId) {
        return makeRequest('/courier/assign/awb', {
            method: 'POST',
            body: { shipment_id: Number(shipmentId) }
        })
    },

    trackByAwb(awb) {
        return makeRequest(`/courier/track/awb/${encodeURIComponent(awb)}`)
    },

    generateLabel(awb) {
        return makeRequest(`/courier/generate/label?awb=${encodeURIComponent(awb)}`, { method: 'GET' })
    },

    generateManifest(shipmentIds) {
        return makeRequest('/manifests/generate', {
            method: 'POST',
            body: { shipment_ids: shipmentIds.map(id => Number(id)) }
        })
    },

    getServiceability(postcode, weight) {
        const pickup = config.SHIPROCKET.PICKUP_POSTCODE || '110001'
        return makeRequest(`/courier/serviceability?pickup_postcode=${pickup}&delivery_postcode=${postcode}&weight=${weight}&is_return=0`)
    },

    request: makeRequest
}
