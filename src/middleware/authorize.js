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

/** Admin always allowed; others need canManageUsers flag (user credentials permission). */
export const authorizeManageUsers = (req, res, next) => {
    try {
        if (!req.authenticatedUser) {
            return httpError(next, new Error(responseMessage.UNAUTHORIZED), req, 401)
        }

        const { role, canManageUsers } = req.authenticatedUser
        const hasFlag = canManageUsers === true || canManageUsers === 1 || canManageUsers === '1'
        if (role === 'admin' || hasFlag) {
            return next()
        }

        return httpError(next, new Error('FORBIDDEN_ACCESS: User management permission required'), req, 403)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export default authorizeRoles
