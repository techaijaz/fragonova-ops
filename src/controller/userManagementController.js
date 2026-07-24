import httpResponse from '../util/httpResponse.js'
import responseMessage from '../constant/responseMessage.js'
import httpError from '../util/httpError.js'
import {
    validateJoiSchema,
    validationCreateManagedUserBody,
    validationUpdateManagedUserBody
} from '../service/validationService.js'
import quiker from '../util/quiker.js'
import databaseService from '../service/databaseService.js'
import { EUserRole } from '../constant/userConstant.js'
import rbacService from '../service/rbacService.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
dayjs.extend(utc)

const isAdminActor = (actor) => actor?.role === EUserRole.ADMIN

const resolvePrivileges = (actor, requestedRole, requestedCanManageUsers) => {
    let role = requestedRole || EUserRole.USER
    let canManageUsers = requestedCanManageUsers === true

    if (!isAdminActor(actor)) {
        if (role === EUserRole.ADMIN) {
            return { error: 'Only admin can assign admin role' }
        }
        canManageUsers = false
    }

    return { role, canManageUsers }
}

const parsePhoneFields = (phone) => {
    const { countryCode, isoCode, internationalNumber } = quiker.parsePhoneNumber('+' + phone)
    if (!countryCode || !isoCode || !internationalNumber) {
        return { error: responseMessage.INCORECT_PHONE_NUMBER }
    }
    const timezone = quiker.countryTimezone(isoCode)
    if (!timezone || !timezone.length) {
        return { error: responseMessage.INCORECT_PHONE_NUMBER }
    }
    return {
        phoneIsoCode: isoCode,
        phoneCountryCode: countryCode,
        phoneInternationalNumber: internationalNumber,
        timezone: timezone[0].name
    }
}

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await databaseService.listUsers()
        httpResponse(req, res, 200, responseMessage.SUCCESS, users)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getUserById = async (req, res, next) => {
    try {
        const user = await databaseService.findUserById(req.params.id)
        if (!user) {
            return httpError(next, new Error(responseMessage.NOT_FOUND('User')), req, 404)
        }
        const safe = { ...user }
        delete safe.password
        delete safe.refreshToken
        delete safe.passwordResetToken
        delete safe.accountConfirmationToken
        delete safe.accountConfirmationCode
        httpResponse(req, res, 200, responseMessage.SUCCESS, safe)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const createUser = async (req, res, next) => {
    try {
        const { error, value } = validateJoiSchema(validationCreateManagedUserBody, req.body)
        if (error) {
            return httpError(next, error, req, 422)
        }

        const { name, email, phone, password, role: requestedRole, canManageUsers: requestedCanManage, permissionOverrides } = value
        const privileges = resolvePrivileges(req.authenticatedUser, requestedRole, requestedCanManage)
        if (privileges.error) {
            return httpError(next, new Error(privileges.error), req, 403)
        }

        let overrides = null
        if (permissionOverrides !== undefined) {
            if (!isAdminActor(req.authenticatedUser)) {
                return httpError(next, new Error('Only admin can set special permissions'), req, 403)
            }
            overrides = rbacService.sanitizePermissionOverrides(permissionOverrides)
        }

        const existing = await databaseService.findUserByEmail(email)
        if (existing) {
            return httpError(next, responseMessage.ALREADY_EXIST('User', email), req, 422)
        }

        const phoneFields = parsePhoneFields(phone)
        if (phoneFields.error) {
            return httpError(next, phoneFields.error, req, 422)
        }

        const token = quiker.generateRandomId()
        const code = quiker.generateOtp(6)
        const encryptedPassword = await quiker.hashedPassword(password)

        const newUser = await databaseService.registerUser({
            name,
            email,
            ...phoneFields,
            password: encryptedPassword,
            role: privileges.role,
            canManageUsers: privileges.canManageUsers,
            permissionOverrides: overrides,
            consent: true,
            accountConfirmationStatus: true,
            accountConfirmationToken: token,
            accountConfirmationCode: code,
            accountConfirmationTimestamp: dayjs().utc().toDate(),
            passwordResetToken: token,
            passwordResetExpiry: null,
            passwordResetLastResetAt: null,
            refreshToken: null,
            lastLoginAt: null
        })

        const safe = { ...newUser }
        delete safe.password
        delete safe.refreshToken
        httpResponse(req, res, 201, responseMessage.SUCCESS, safe)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const updateUser = async (req, res, next) => {
    try {
        const { error, value } = validateJoiSchema(validationUpdateManagedUserBody, req.body)
        if (error) {
            return httpError(next, error, req, 422)
        }

        const existing = await databaseService.findUserById(req.params.id)
        if (!existing) {
            return httpError(next, new Error(responseMessage.NOT_FOUND('User')), req, 404)
        }

        const data = {}

        if (value.name !== undefined) data.name = value.name

        if (value.email !== undefined && value.email !== existing.email) {
            const emailTaken = await databaseService.findUserByEmail(value.email)
            if (emailTaken) {
                return httpError(next, responseMessage.ALREADY_EXIST('User', value.email), req, 422)
            }
            data.email = value.email
        }

        if (value.phone !== undefined) {
            const phoneFields = parsePhoneFields(value.phone)
            if (phoneFields.error) {
                return httpError(next, phoneFields.error, req, 422)
            }
            Object.assign(data, phoneFields)
        }

        if (value.password !== undefined) {
            data.password = await quiker.hashedPassword(value.password)
        }

        if (value.role !== undefined || value.canManageUsers !== undefined) {
            const privileges = resolvePrivileges(
                req.authenticatedUser,
                value.role !== undefined ? value.role : existing.role,
                value.canManageUsers !== undefined ? value.canManageUsers : existing.canManageUsers
            )
            if (privileges.error) {
                return httpError(next, new Error(privileges.error), req, 403)
            }
            if (value.role !== undefined) data.role = privileges.role
            if (value.canManageUsers !== undefined) {
                if (!isAdminActor(req.authenticatedUser)) {
                    return httpError(next, new Error('Only admin can change user credentials permission'), req, 403)
                }
                data.canManageUsers = privileges.canManageUsers
            }
        }

        if (value.permissionOverrides !== undefined) {
            if (!isAdminActor(req.authenticatedUser)) {
                return httpError(next, new Error('Only admin can set special permissions'), req, 403)
            }
            data.permissionOverrides = rbacService.sanitizePermissionOverrides(value.permissionOverrides)
        }

        const updated = await databaseService.updateUser(req.params.id, data)
        const safe = { ...updated }
        delete safe.password
        delete safe.refreshToken
        delete safe.passwordResetToken
        delete safe.accountConfirmationToken
        delete safe.accountConfirmationCode
        httpResponse(req, res, 200, responseMessage.SUCCESS, safe)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params
        if (id === req.authenticatedUser.id) {
            return httpError(next, new Error('You cannot delete your own account'), req, 400)
        }

        const existing = await databaseService.findUserById(id)
        if (!existing) {
            return httpError(next, new Error(responseMessage.NOT_FOUND('User')), req, 404)
        }

        if (existing.role === EUserRole.ADMIN && !isAdminActor(req.authenticatedUser)) {
            return httpError(next, new Error('Only admin can delete admin users'), req, 403)
        }

        await databaseService.deleteUser(id)
        httpResponse(req, res, 200, responseMessage.SUCCESS, null)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}
