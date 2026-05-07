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

export const validateJoiSchema = (schema, value) => {
    const result = schema.validate(value)
    return {
        value: result.value,
        error: result.error?.message
    }
}
