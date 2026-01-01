import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUser } from "@shared/routes";
import { useLocation } from "wouter";
import { User } from "@shared/schema";

export function useUser() {
  return useQuery<User | null>({
    queryKey: [api.auth.user.path],
    queryFn: async () => {
      const res = await fetch(api.auth.user.path);
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    },
    retry: false,
  });
}

export function useAllUsers() {
  return useQuery<User[]>({
    queryKey: [api.admin.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.users.list.path);
      if (!res.ok) throw new Error("Failed to fetch all users");
      return await res.json();
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid username or password");
        }
        throw new Error("Login failed");
      }

      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData([api.auth.user.path], user);
      if (user.role === "admin") {
        setLocation("/admin-dashboard");
      } else if (user.role === "trainer") {
        setLocation("/trainer-dashboard");
      } else {
        setLocation("/member-dashboard");
      }
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(api.auth.register.path, {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Registration failed");
        }
        throw new Error("Registration failed");
      }

      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData([api.auth.user.path], user);
      if (user.role === "trainer") {
        setLocation("/trainer-dashboard");
      } else {
        setLocation("/member-dashboard");
      }
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { method: api.auth.logout.method });
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.user.path], null);
      setLocation("/");
    },
  });
}
