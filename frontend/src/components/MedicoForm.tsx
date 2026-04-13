import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import FileUploadField from './FileUploadField';
import { getEspecialidades, addComprovante, deleteComprovante } from '../api/medicos';
import type { Medico, Especialidade, MedicoEspecialidade } from '../types';

const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
];

const ESTADO_CIVIL_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
  { value: 'casado_separacao_total', label: 'Casado(a) - separação total de bens' },
  { value: 'casado_comunhao_total', label: 'Casado(a) - comunhão total de bens' },
  { value: 'casado_comunhao_parcial', label: 'Casado(a) - comunhão parcial de bens' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'separado', label: 'Separado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
];

interface FormValues {
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  rg_numero: string;
  estado_civil: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  instituicao_formacao: string;
  ano_formatura: string;
  link_lattes: string;
  crm_numero: string;
  crm_estado: string;
  tipo_chave_pix: string;
  chave_pix: string;
  status: string;
}

interface Props {
  initial?: Medico;
  onSubmit: (data: FormData) => Promise<void>;
  isAdmin?: boolean;
}

export default function MedicoForm({ initial, onSubmit, isAdmin }: Props) {
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [comprovantes, setComprovantes] = useState<MedicoEspecialidade[]>(
    initial?.comprovantes_especialidade ?? []
  );

  const [novoEsp, setNovoEsp] = useState<number | ''>('');
  const [novoArquivo, setNovoArquivo] = useState<File | null>(null);
  const [addingComp, setAddingComp] = useState(false);

  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  // Documentos
  const [cnh, setCnh] = useState<File | null>(null);
  const [rgCpf, setRgCpf] = useState<File | null>(null);
  const [crmDoc, setCrmDoc] = useState<File | null>(null);
  const [comprovanteEndereco, setComprovanteEndereco] = useState<File | null>(null);
  const [diplomaMedico, setDiplomaMedico] = useState<File | null>(null);
  const [declaracaoQuitacao, setDeclaracaoQuitacao] = useState<File | null>(null);
  const [eticaCrm, setEticaCrm] = useState<File | null>(null);
  const [certidaoCasamento, setCertidaoCasamento] = useState<File | null>(null);
  const [curriculoLattes, setCurriculoLattes] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      nome_completo: initial?.nome_completo ?? '',
      cpf: initial?.cpf ?? '',
      data_nascimento: initial?.data_nascimento ?? '',
      rg_numero: initial?.rg_numero ?? '',
      estado_civil: initial?.estado_civil ?? '',
      email: initial?.email ?? '',
      telefone: initial?.telefone ?? '',
      cep: initial?.cep ?? '',
      logradouro: initial?.logradouro ?? '',
      numero: initial?.numero ?? '',
      complemento: initial?.complemento ?? '',
      bairro: initial?.bairro ?? '',
      cidade: initial?.cidade ?? '',
      estado: initial?.estado ?? '',
      instituicao_formacao: initial?.instituicao_formacao ?? '',
      ano_formatura: initial?.ano_formatura?.toString() ?? '',
      link_lattes: initial?.link_lattes ?? '',
      crm_numero: initial?.crm_numero ?? '',
      crm_estado: initial?.crm_estado ?? '',
      tipo_chave_pix: initial?.tipo_chave_pix ?? '',
      chave_pix: initial?.chave_pix ?? '',
      status: initial?.status ?? 'pendente',
    },
  });

  const estadoCivil = watch('estado_civil');
  const isCasado = estadoCivil.startsWith('casado');

  useEffect(() => {
    getEspecialidades().then(setEspecialidades).catch(() => {});
  }, []);

  const handleFormSubmit = async (values: FormValues) => {
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, v as string);
    });
    if (fotoPerfil) fd.append('foto_perfil', fotoPerfil);
    if (cnh) fd.append('cnh', cnh);
    if (rgCpf) fd.append('rg_cpf', rgCpf);
    if (crmDoc) fd.append('crm_doc', crmDoc);
    if (comprovanteEndereco) fd.append('comprovante_endereco', comprovanteEndereco);
    if (diplomaMedico) fd.append('diploma_medico', diplomaMedico);
    if (declaracaoQuitacao) fd.append('declaracao_quitacao_crm', declaracaoQuitacao);
    if (eticaCrm) fd.append('etica_crm', eticaCrm);
    if (certidaoCasamento) fd.append('certidao_casamento', certidaoCasamento);
    if (curriculoLattes) fd.append('curriculo_lattes', curriculoLattes);

    try {
      await onSubmit(fd);
      toast.success('Dados salvos com sucesso!');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.values(data)
          .flatMap((v) => (Array.isArray(v) ? v : [String(v)]))
          .join(' ');
        toast.error(msgs || 'Erro ao salvar.');
      } else {
        toast.error('Erro ao salvar. Verifique os dados.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComprovante = async () => {
    if (!novoEsp || !initial?.id) return;
    setAddingComp(true);
    const fd = new FormData();
    fd.append('especialidade', String(novoEsp));
    if (novoArquivo) fd.append('comprovante', novoArquivo);
    try {
      const novo = await addComprovante(initial.id, fd);
      setComprovantes((prev) => [...prev, novo]);
      setNovoEsp('');
      setNovoArquivo(null);
      toast.success('Comprovante adicionado!');
    } catch {
      toast.error('Erro ao adicionar comprovante.');
    } finally {
      setAddingComp(false);
    }
  };

  const handleDeleteComprovante = async (comprovanteId: number) => {
    if (!initial?.id) return;
    try {
      await deleteComprovante(initial.id, comprovanteId);
      setComprovantes((prev) => prev.filter((c) => c.id !== comprovanteId));
      toast.success('Comprovante removido.');
    } catch {
      toast.error('Erro ao remover comprovante.');
    }
  };

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  const sectionCls = 'space-y-4';
  const sectionTitleCls = 'text-base font-semibold text-slate-700 border-b border-slate-200 pb-2';

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">

      {/* === DADOS PESSOAIS === */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>Dados Pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Nome completo</label>
            <input className={inputCls} {...register('nome_completo')} />
          </div>
          <div>
            <label className={labelCls}>CPF</label>
            <input className={inputCls} placeholder="000.000.000-00" {...register('cpf')} />
          </div>
          <div>
            <label className={labelCls}>RG</label>
            <input className={inputCls} placeholder="0000000" {...register('rg_numero')} />
          </div>
          <div>
            <label className={labelCls}>Data de nascimento</label>
            <input type="date" className={inputCls} {...register('data_nascimento')} />
          </div>
          <div>
            <label className={labelCls}>Estado civil</label>
            <select className={inputCls} {...register('estado_civil')}>
              {ESTADO_CIVIL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>E-mail</label>
            <input type="email" className={inputCls} {...register('email')} />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input className={inputCls} placeholder="(00) 00000-0000" {...register('telefone')} />
          </div>
          <div className="md:col-span-2">
            <FileUploadField
              label="Foto de perfil"
              name="foto_perfil"
              accept="image/*"
              currentUrl={initial?.foto_perfil}
              onChange={setFotoPerfil}
            />
          </div>
          {isAdmin && (
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} {...register('status')}>
                <option value="pendente">Pendente</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* === ENDEREÇO === */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>CEP</label>
            <input className={inputCls} placeholder="00000-000" {...register('cep')} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Logradouro</label>
            <input className={inputCls} {...register('logradouro')} />
          </div>
          <div>
            <label className={labelCls}>Número</label>
            <input className={inputCls} {...register('numero')} />
          </div>
          <div>
            <label className={labelCls}>Complemento</label>
            <input className={inputCls} {...register('complemento')} />
          </div>
          <div>
            <label className={labelCls}>Bairro</label>
            <input className={inputCls} {...register('bairro')} />
          </div>
          <div>
            <label className={labelCls}>Cidade</label>
            <input className={inputCls} {...register('cidade')} />
          </div>
          <div>
            <label className={labelCls}>Estado</label>
            <select className={inputCls} {...register('estado')}>
              <option value="">Selecione</option>
              {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* === FORMAÇÃO === */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>Formação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Instituição de formação (Faculdade)</label>
            <input className={inputCls} {...register('instituicao_formacao')} />
          </div>
          <div>
            <label className={labelCls}>Ano de formatura</label>
            <input
              type="number"
              className={inputCls}
              min={1950}
              max={new Date().getFullYear()}
              {...register('ano_formatura')}
            />
          </div>
          <div>
            <label className={labelCls}>Link Currículo Lattes</label>
            <input
              type="url"
              className={inputCls}
              placeholder="http://lattes.cnpq.br/..."
              {...register('link_lattes')}
            />
          </div>
        </div>
      </div>

      {/* === CRM / ESPECIALIDADES === */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>CRM / Especialidades</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Número do CRM</label>
              <input className={inputCls} {...register('crm_numero')} />
            </div>
            <div>
              <label className={labelCls}>Estado do CRM</label>
              <select className={inputCls} {...register('crm_estado')}>
                <option value="">Selecione</option>
                {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          {/* Comprovantes de especialidade */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Especialidades e Comprovantes</h4>

            {comprovantes.length > 0 ? (
              <div className="space-y-2 mb-4">
                {comprovantes.map((c) => {
                  const esp = especialidades.find((e) => e.id === c.especialidade);
                  return (
                    <div key={c.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm font-medium">{c.especialidade_nome || esp?.nome}</span>
                        {c.comprovante && (
                          <a
                            href={c.comprovante}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline ml-2"
                          >
                            Comprovante
                          </a>
                        )}
                      </div>
                      {initial?.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComprovante(c.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-3">Nenhuma especialidade adicionada.</p>
            )}

            {initial?.id ? (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-blue-700">Adicionar especialidade</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={novoEsp}
                    onChange={(e) => setNovoEsp(e.target.value ? Number(e.target.value) : '')}
                    className={inputCls}
                  >
                    <option value="">Selecione a especialidade</option>
                    {especialidades
                      .filter((e) => !comprovantes.find((c) => c.especialidade === e.id))
                      .map((e) => (
                        <option key={e.id} value={e.id}>{e.nome}</option>
                      ))}
                  </select>
                  <FileUploadField
                    label="Comprovante"
                    name="novo_comprovante"
                    accept=".pdf,image/*"
                    onChange={setNovoArquivo}
                  />
                </div>
                <button
                  type="button"
                  disabled={!novoEsp || addingComp}
                  onClick={handleAddComprovante}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {addingComp ? 'Adicionando...' : '+ Adicionar'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Salve o cadastro primeiro para adicionar especialidades.</p>
            )}
          </div>
        </div>
      </div>

      {/* === FINANCEIRO === */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tipo de chave PIX</label>
            <select className={inputCls} {...register('tipo_chave_pix')}>
              <option value="">Sem chave PIX</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="aleatoria">Chave Aleatória</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Chave PIX</label>
            <input className={inputCls} {...register('chave_pix')} />
          </div>
        </div>
      </div>

      {/* === UPLOAD DE DOCUMENTOS === */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>Upload de Documentos</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <span className="mt-0.5 shrink-0">&#9432;</span>
            <span>Todos os arquivos devem estar no formato <strong>PDF</strong> e ter no máximo <strong>4 MB</strong>.</span>
          </div>
          <FileUploadField
            label="CNH (preferencialmente digital)"
            name="cnh"
            accept=".pdf,image/*"
            currentUrl={initial?.cnh}
            onChange={setCnh}
          />
          <FileUploadField
            label="RG e CPF (frente e verso)"
            name="rg_cpf"
            accept=".pdf,image/*"
            currentUrl={initial?.rg_cpf}
            onChange={setRgCpf}
          />
          <FileUploadField
            label="CRM (frente e verso)"
            name="crm_doc"
            accept=".pdf,image/*"
            currentUrl={initial?.crm_doc}
            onChange={setCrmDoc}
          />
          <FileUploadField
            label="Diploma médico"
            name="diploma_medico"
            accept=".pdf,image/*"
            currentUrl={initial?.diploma_medico}
            onChange={setDiplomaMedico}
          />
          <FileUploadField
            label="Certidão de regularidade fiscal CRM"
            name="declaracao_quitacao_crm"
            accept=".pdf,image/*"
            currentUrl={initial?.declaracao_quitacao_crm}
            onChange={setDeclaracaoQuitacao}
          />
          <FileUploadField
            label="Certidão Ético-profissional CRM"
            name="etica_crm"
            accept=".pdf,image/*"
            currentUrl={initial?.etica_crm}
            onChange={setEticaCrm}
          />
          <FileUploadField
            label="Comprovante de endereço"
            name="comprovante_endereco"
            accept=".pdf,image/*"
            currentUrl={initial?.comprovante_endereco}
            onChange={setComprovanteEndereco}
          />
          {isCasado && (
            <FileUploadField
              label="Certidão de Casamento"
              name="certidao_casamento"
              accept=".pdf,image/*"
              currentUrl={initial?.certidao_casamento}
              onChange={setCertidaoCasamento}
            />
          )}
          <FileUploadField
            label="Currículo Lattes resumido atualizado"
            name="curriculo_lattes"
            accept=".pdf,image/*"
            currentUrl={initial?.curriculo_lattes}
            onChange={setCurriculoLattes}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded-lg transition disabled:opacity-60"
        >
          {submitting ? 'Salvando...' : 'Salvar Cadastro'}
        </button>
      </div>
    </form>
  );
}
