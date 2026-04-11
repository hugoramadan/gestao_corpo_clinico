export type Role = 'medico' | 'gestor' | 'admin';

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: Role;
  must_change_password: boolean;
}

export interface User {
  id: number;
  nome: string;
  email: string;
  role: Role;
  is_active: boolean;
  date_joined: string;
  must_change_password: boolean;
}

export type Status = 'pendente' | 'ativo' | 'inativo';

export type TipoChavePix = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';

export interface Especialidade {
  id: number;
  nome: string;
}

export interface MedicoEspecialidade {
  id: number;
  especialidade: number;
  especialidade_nome: string;
  comprovante: string | null;
  data_upload: string;
}

export type EstadoCivil =
  | 'solteiro'
  | 'uniao_estavel'
  | 'casado_separacao_total'
  | 'casado_comunhao_total'
  | 'casado_comunhao_parcial'
  | 'divorciado'
  | 'separado'
  | 'viuvo'
  | '';

export interface Medico {
  id: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  rg_numero: string;
  estado_civil: EstadoCivil;
  foto_perfil: string | null;
  email: string;
  telefone: string;
  // Endereço
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  // Formação
  instituicao_formacao: string;
  ano_formatura: number;
  link_lattes: string;
  // CRM
  crm_numero: string;
  crm_estado: string;
  especialidades: number[];
  especialidades_nomes: Especialidade[];
  // Financeiro
  tipo_chave_pix: TipoChavePix | '';
  chave_pix: string;
  // Documentos
  cnh: string | null;
  rg_cpf: string | null;
  crm_doc: string | null;
  comprovante_endereco: string | null;
  diploma_medico: string | null;
  declaracao_quitacao_crm: string | null;
  etica_crm: string | null;
  certidao_casamento: string | null;
  curriculo_lattes: string | null;
  // Status
  status: Status;
  created_at: string;
  updated_at: string;
  comprovantes_especialidade: MedicoEspecialidade[];
  // Completude
  campos_pendentes: { campo: string; label: string }[];
  cadastro_completo: boolean;
}

export interface MedicoListItem {
  id: number;
  nome_completo: string;
  cpf: string;
  crm_numero: string;
  crm_estado: string;
  especialidades: Especialidade[];
  email: string;
  telefone: string;
  status: Status;
  foto_perfil: string | null;
  created_at: string;
}
