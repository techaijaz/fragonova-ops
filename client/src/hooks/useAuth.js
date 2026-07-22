import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  loginUser,
  registerUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
  getSelf,
  confirmAccount
} from '../services/authApi'

// ─── Query: current user ───────────────────────────────────
export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: getSelf,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data // unwrap { success, statusCode, data }
  })
}

// ─── Mutations ─────────────────────────────────────────────
export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    }
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: registerUser
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(['user'], null)
      queryClient.clear()
    }
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }) => resetPassword(token, { newPassword })
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword
  })
}

export function useConfirmAccount() {
  return useMutation({
    mutationFn: ({ token, code }) => confirmAccount(token, code)
  })
}
