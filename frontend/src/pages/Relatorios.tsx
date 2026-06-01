import { useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { exportarRelatorio } from '../api/medicos';

type FieldDef = { key: string; label: string };
type Group = { title: string; fields: FieldDef[] };

const GROUPS: Group[] = [
  {
    title: 'Dados Pessoais',
    fields: [
      { key: 'nome_completo', label: 'Nome Completo' },
      { key: 'cpf', label: 'CPF' },
      { key: 'data_nascimento', label: 'Data de Nascimento' },
      { key: 'rg_numero', label: 'RG' },
      { key: 'estado_civil', label: 'Estado Civil' },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone', label: 'Telefone' },
    ],
  },
  {
    title: 'Endereço',
    fields: [
      { key: 'cep', label: 'CEP' },
      { key: 'logradouro', label: 'Logradouro' },
      { key: 'numero', label: 'Número' },
      { key: 'complemento', label: 'Complemento' },
      { key: 'bairro', label: 'Bairro' },
      { key: 'cidade', label: 'Cidade' },
      { key: 'estado', label: 'Estado (UF)' },
    ],
  },
  {
    title: 'Formação',
    fields: [
      { key: 'instituicao_formacao', label: 'Instituição de Formação' },
      { key: 'ano_formatura', label: 'Ano de Formatura' },
      { key: 'link_lattes', label: 'Link Lattes' },
    ],
  },
  {
    title: 'CRM e Especialidades',
    fields: [
      { key: 'crm_numero', label: 'CRM' },
      { key: 'crm_estado', label: 'UF CRM' },
      { key: 'especialidades', label: 'Especialidades' },
    ],
  },
  {
    title: 'Dados Financeiros',
    fields: [
      { key: 'tipo_chave_pix', label: 'Tipo Chave PIX' },
      { key: 'chave_pix', label: 'Chave PIX' },
    ],
  },
  {
    title: 'Situação',
    fields: [
      { key: 'status', label: 'Status' },
      { key: 'cadastro_completo', label: 'Cadastro Completo' },
      { key: 'created_at', label: 'Data de Cadastro' },
      { key: 'updated_at', label: 'Última Atualização' },
    ],
  },
];

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'ativo_com_contrato', label: 'Ativo com Contrato' },
  { value: 'ativo_sem_contrato', label: 'Ativo sem Contrato' },
  { value: 'inativo', label: 'Inativo' },
];

const ALL_KEYS = GROUPS.flatMap((g) => g.fields.map((f) => f.key));

export default function Relatorios() {
  const [nome, setNome] = useState('Relatório de Médicos');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(ALL_KEYS));
  const [selectedStatus, setSelectedStatus] = useState<Set<string>>(new Set());
  const [situacao, setSituacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(GROUPS.map((g) => g.title)));

  const toggleField = (key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (group: Group) => {
    const keys = group.fields.map((f) => f.key);
    const allSelected = keys.every((k) => selectedFields.has(k));
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (allSelected) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  };

  const toggleGroupOpen = (title: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const toggleStatus = (value: string) => {
    setSelectedStatus((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const selectAllFields = () => setSelectedFields(new Set(ALL_KEYS));
  const clearAllFields = () => setSelectedFields(new Set());

  const handleExport = async () => {
    if (selectedFields.size === 0) {
      toast.error('Selecione ao menos um campo para exportar.');
      return;
    }
    setLoading(true);
    try {
      await exportarRelatorio({
        nome: nome.trim() || 'Relatório de Médicos',
        fields: ALL_KEYS.filter((k) => selectedFields.has(k)),
        status: Array.from(selectedStatus),
        situacao,
      });
      toast.success('Relatório exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Relatórios</h2>
        <p className="text-slate-500 mb-8 text-sm">Exporte dados dos médicos cadastrados em formato CSV.</p>

        <div className="space-y-6">
          {/* Nome do relatório */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-700 mb-3">Nome do Relatório</h3>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Relatório de Médicos Ativos"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Será usado como nome do arquivo CSV baixado.</p>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-700 mb-4">Filtros</h3>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Status</p>
                <div className="flex flex-wrap gap-3">
                  {STATUS_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatus.has(opt.value)}
                        onChange={() => toggleStatus(opt.value)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">Nenhum selecionado = todos os status.</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Situação do Cadastro</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { value: '', label: 'Todos' },
                    { value: 'incompleto', label: 'Somente incompletos' },
                    { value: 'completo', label: 'Somente completos' },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="situacao"
                        value={opt.value}
                        checked={situacao === opt.value}
                        onChange={() => setSituacao(opt.value)}
                        className="border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Seleção de campos */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700">Campos do Relatório</h3>
              <div className="flex gap-3 text-xs">
                <button onClick={selectAllFields} className="text-blue-600 hover:underline">
                  Selecionar todos
                </button>
                <span className="text-slate-300">|</span>
                <button onClick={clearAllFields} className="text-slate-500 hover:underline">
                  Limpar
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {selectedFields.size} de {ALL_KEYS.length} campos selecionados
            </p>

            <div className="space-y-3">
              {GROUPS.map((group) => {
                const keys = group.fields.map((f) => f.key);
                const allSelected = keys.every((k) => selectedFields.has(k));
                const someSelected = keys.some((k) => selectedFields.has(k));
                const isOpen = openGroups.has(group.title);

                return (
                  <div key={group.title} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() => toggleGroup(group)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => toggleGroupOpen(group.title)}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <span className="text-sm font-medium text-slate-700">{group.title}</span>
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {isOpen && (
                      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {group.fields.map((field) => (
                          <label key={field.key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedFields.has(field.key)}
                              onChange={() => toggleField(field.key)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-600">{field.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botão exportar */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={loading || selectedFields.size === 0}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Exportando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportar CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
