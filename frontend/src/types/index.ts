export type Role = 'medico' | 'gestor' | 'admin';

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  roles: Role[];
  must_change_password: boolean;
}

export interface Funcionario {
  cpf: string | null;
  data_nascimento: string | null;
  email: string;
  status: 'ativo' | 'inativo';
}

export interface User {
  id: number;
  nome: string;
  email: string;
  roles: Role[];
  is_active: boolean;
  date_joined: string;
  must_change_password: boolean;
  funcionario: Funcionario | null;
  status: 'ativo' | 'inativo' | null;
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
  user_id: number | null;
  nome_completo: string;
  cpf: string | null;
  data_nascimento: string | null;
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
  ano_formatura: number | null;
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
  cpf: string | null;
  crm_numero: string;
  crm_estado: string;
  especialidades: Especialidade[];
  email: string;
  telefone: string;
  status: Status;
  foto_perfil: string | null;
  created_at: string;
}
