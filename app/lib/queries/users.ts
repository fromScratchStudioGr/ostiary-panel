import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import { type ApiUser, mapApiUser } from "../api-mappers";
import { queryKeys } from "../query-keys";

export function useUsers(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => (await apiFetch<ApiUser[]>("/users")).map(mapApiUser),
    enabled: options.enabled,
  });
}

type NewAdminInput = {
  username: string;
  password: string;
  passwordConfirm: string;
};

export function useAddAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewAdminInput) =>
      apiFetch<void>("/register", {
        method: "POST",
        body: JSON.stringify({
          username: input.username,
          password: input.password,
          password_confirm: input.passwordConfirm,
        }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

type UpdateUserPasswordInput = {
  userId: string;
  password: string;
  passwordConfirm: string;
};

export function useUpdateUserPassword() {
  return useMutation({
    mutationFn: (input: UpdateUserPasswordInput) =>
      apiFetch<void>("/users/password", {
        method: "PATCH",
        body: JSON.stringify({
          userId: Number(input.userId),
          password: input.password,
          passwordConfirm: input.passwordConfirm,
        }),
      }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiFetch<void>(`/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}
