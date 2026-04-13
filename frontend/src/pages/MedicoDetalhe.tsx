import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMedico, deleteMedico } from '../api/medicos';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import CadastroIncompletoAviso from '../components/CadastroIncompletoAviso';
import type { Medico } from '../types';
import { mediaUrl } from '../utils/media';

const STATUS_COLORS = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-red-100 text-red-600',
  pendente: 'bg-yellow-100 text-yellow-700',
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-800 font-medium mt-0.5">{value}</p>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url?: string | null }) {
  if (!url) return null;
  return (
    <a
      href={mediaUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 text-sm text-blue-600 hover:underline"
    >
      📎 {label}
    </a>
  );
}

export default function MedicoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isRole, user } = useAuth();
  const [medico, setMedico] = useState<Medico | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getMedico(Number(id))
      .then(setMedico)
      .catch(() => navigate('/medicos'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!medico || !confirm(`Excluir o cadastro de ${medico.nome_completo}?`)) return;
    await deleteMedico(medico.id);
    navigate('/medicos');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!medico) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Aviso de cadastro incompleto */}
        {medico && !medico.cadastro_completo && (
          <CadastroIncompletoAviso camposPendentes={medico.campos_pendentes} />
        )}

        {/* Cabeçalho */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-start gap-4">
          {medico.foto_perfil ? (
            <img src={mediaUrl(medico.foto_perfil)} alt="Foto" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl text-blue-400 shrink-0">👤</div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-800">{medico.nome_completo}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[medico.status]}`}>
                {medico.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 break-words">
              CRM {medico.crm_numero}/{medico.crm_estado} · {medico.email}
            </p>
            <p className="text-xs text-slate-400 mt-1">Cadastrado em: {new Date(medico.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <Link
              to={`/medicos/${medico.id}/editar`}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Editar
            </Link>
            {isRole('admin') && medico.user_id !== user?.id && medico.status === 'inativo' && (
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Excluir
              </button>
            )}
          </div>
        </div>

        {/* Dados em seções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Dados Pessoais</h3>
            <Field label="CPF" value={medico.cpf} />
            <Field label="Data de Nascimento" value={medico.data_nascimento ? new Date(medico.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : undefined} />
            <Field label="Telefone" value={medico.telefone} />
            <Field label="E-mail" value={medico.email} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Endereço</h3>
            <Field label="Logradouro" value={`${medico.logradouro}, ${medico.numero}${medico.complemento ? ` — ${medico.complemento}` : ''}`} />
            <Field label="Bairro" value={medico.bairro} />
            <Field label="Cidade/Estado" value={`${medico.cidade}/${medico.estado}`} />
            <Field label="CEP" value={medico.cep} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Formação</h3>
            <Field label="Instituição" value={medico.instituicao_formacao} />
            <Field label="Ano de Formatura" value={medico.ano_formatura} />
            {medico.link_lattes && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Currículo Lattes</p>
                <a href={medico.link_lattes} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  {medico.link_lattes}
                </a>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Financeiro</h3>
            <Field label="Tipo de chave PIX" value={medico.tipo_chave_pix || 'Não informado'} />
            <Field label="Chave PIX" value={medico.chave_pix || 'Não informada'} />
          </div>
        </div>

        {/* Especialidades */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 border-b pb-2 mb-3">Especialidades</h3>
          {medico.comprovantes_especialidade.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {medico.comprovantes_especialidade.map((c) => (
                <div key={c.id} className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <span className="text-sm font-medium">{c.especialidade_nome}</span>
                  {c.comprovante && (
                    <a href={mediaUrl(c.comprovante)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                      📎
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nenhuma especialidade cadastrada.</p>
          )}
        </div>

        {/* Documentos */}
        {(() => {
          const docs = [
            { label: 'CNH', url: medico.cnh },
            { label: 'RG / CPF', url: medico.rg_cpf },
            { label: 'CRM', url: medico.crm_doc },
            { label: 'Comprovante de Endereço', url: medico.comprovante_endereco },
            { label: 'Diploma Médico', url: medico.diploma_medico },
            { label: 'Declaração de Quitação com CRM', url: medico.declaracao_quitacao_crm },
            { label: 'Declaração de Ética com CRM', url: medico.etica_crm },
            { label: 'Certidão de Casamento', url: medico.certidao_casamento },
            { label: 'Currículo Lattes', url: medico.curriculo_lattes },
          ].filter((d) => d.url);
          return (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-semibold text-slate-700 border-b pb-2 mb-3">Documentos</h3>
              {docs.length > 0 ? (
                <div className="space-y-2">
                  {docs.map(({ label, url }) => (
                    <DocLink key={label} label={label} url={url} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Nenhum documento enviado.</p>
              )}
            </div>
          );
        })()}

        <div className="flex justify-start">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
