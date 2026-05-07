import prisma from '../config/prisma.js'

export default {
    connect: async () => {
        try {
            await prisma.$connect()
            return prisma
        } catch (error) {
            throw error
        }
    },
    findUserByEmail: (email) => {
        return prisma.user.findUnique({
            where: { email }
        })
    },
    findUserById: (id) => {
        return prisma.user.findUnique({
            where: { id }
        })
    },
    registerUser: (userData) => {
        return prisma.user.create({
            data: userData
        })
    },
    findUserByConfirmationTokenAndCode: (token, code) => {
        return prisma.user.findFirst({
            where: {
                accountConfirmationToken: token,
                accountConfirmationCode: code
            }
        })
    },
    findUserByPasswordResetToken: (token) => {
        return prisma.user.findFirst({
            where: {
                passwordResetToken: token
            }
        })
    },
    updateUser: (id, data) => {
        return prisma.user.update({
            where: { id },
            data
        })
    },
    deleteRefreshToken: (token) => {
        return prisma.user.updateMany({
            where: { refreshToken: token },
            data: { refreshToken: null }
        })
    },
    getRefreshToken: (token) => {
        return prisma.user.findFirst({
            where: { refreshToken: token }
        })
    }
}

