import type { Role } from '../types';

export const ROLE_LABEL: Record<Role, string> = {
  medico: 'Médico',
  gestor: 'Gestor',
  admin: 'Administrador',
};

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'medico', label: 'Médico' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'admin', label: 'Administrador' },
];
