import api from './axios';
import type { User } from '../types';

export interface UserCreatePayload {
  nome: string;
  email: string;
  role: string;
  password: string;
  cpf?: string;
}

export interface UserEditPayload {
  nome?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
  new_password?: string;
}

export const getUsers = (search?: string) =>
  api.get<User[]>('/users/', { params: search ? { search } : {} }).then((r) => r.data);

export const getUser = (id: number) =>
  api.get<User>(`/users/${id}/`).then((r) => r.data);

export const createUser = (data: UserCreatePayload) =>
  api.post<User>('/users/', data).then((r) => r.data);

export const updateUser = (id: number, data: UserEditPayload) =>
  api.patch<User>(`/users/${id}/`, data).then((r) => r.data);

export const deleteUser = (id: number) =>
  api.delete(`/users/${id}/`);

export const changePassword = (data: {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}) =>
  api.post('/auth/change-password/', data).then((r) => r.data);
