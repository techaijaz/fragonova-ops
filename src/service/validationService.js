import Joi from 'joi'

export const validationRegisterBody = Joi.object({
    name: Joi.string().required().min(3).max(72).trim(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(4).max(20).required(),
    password: Joi.string().min(8).max(72).required().trim(),
    consent: Joi.boolean().required().valid(true)
})

export const validationLoginBody = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(72).required().trim()
})

export const validationForgotPasswordBody = Joi.object({
    email: Joi.string().email().required()
})

export const validationResetPasswordBody = Joi.object({
    newPassword: Joi.string().min(8).max(72).required().trim()
})

export const validationChangePasswordBody = Joi.object({
    oldPassword: Joi.string().min(8).max(72).required().trim(),
    newPassword: Joi.string().min(8).max(72).required().trim()
})

const permissionOverrideRow = Joi.object({
    canView: Joi.boolean(),
    canCreate: Joi.boolean(),
    canEdit: Joi.boolean(),
    canDelete: Joi.boolean()
})

export const validationCreateManagedUserBody = Joi.object({
    name: Joi.string().required().min(3).max(72).trim(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(4).max(20).required(),
    password: Joi.string().min(8).max(72).required().trim(),
    role: Joi.string().valid('user', 'manager', 'admin').default('user'),
    canManageUsers: Joi.boolean().default(false),
    permissionOverrides: Joi.object().pattern(Joi.string(), permissionOverrideRow).allow(null)
})

export const validationUpdateManagedUserBody = Joi.object({
    name: Joi.string().min(3).max(72).trim(),
    email: Joi.string().email(),
    phone: Joi.string().min(4).max(20),
    password: Joi.string().min(8).max(72).trim(),
    role: Joi.string().valid('user', 'manager', 'admin'),
    canManageUsers: Joi.boolean(),
    permissionOverrides: Joi.object().pattern(Joi.string(), permissionOverrideRow).allow(null)
}).min(1)

export const validateJoiSchema = (schema, value) => {
    const result = schema.validate(value)
    return {
        value: result.value,
        error: result.error?.message
    }
}
