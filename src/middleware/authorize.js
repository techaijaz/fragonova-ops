import httpError from '../util/httpError.js'
import responseMessage from '../constant/responseMessage.js'

/**
 * Authorization middleware to check if user has one of the allowed roles.
 * Must be executed after authentication middleware (req.authenticatedUser).
 * @param {...string} allowedRoles - List of roles permitted to access the route
 */
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.authenticatedUser) {
                return httpError(next, new Error(responseMessage.UNAUTHORIZED), req, 401)
            }

            const { role } = req.authenticatedUser
            if (!allowedRoles.includes(role)) {
                return httpError(next, new Error('FORBIDDEN_ACCESS: Access denied for your role'), req, 403)
            }

            next()
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}

export default authorizeRoles
