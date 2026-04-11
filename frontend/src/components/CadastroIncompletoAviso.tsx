import { useState } from 'react';

interface Props {
  camposPendentes: { campo: string; label: string }[];
}

export default function CadastroIncompletoAviso({ camposPendentes }: Props) {
  const [expandido, setExpandido] = useState(false);

  if (camposPendentes.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
        <div className="flex-1">
          <p className="text-amber-800 font-semibold text-sm">
            Cadastro incompleto — seu perfil ainda não está ativo
          </p>
          <p className="text-amber-700 text-sm mt-1">
            Preencha todos os campos obrigatórios para que seu cadastro seja ativado.{' '}
            <span className="font-medium">{camposPendentes.length} campo{camposPendentes.length > 1 ? 's' : ''} pendente{camposPendentes.length > 1 ? 's' : ''}.</span>
          </p>

          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="text-xs text-amber-700 underline mt-2 hover:text-amber-900"
          >
            {expandido ? 'Ocultar campos pendentes' : 'Ver campos pendentes'}
          </button>

          {expandido && (
            <ul className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
              {camposPendentes.map((c) => (
                <li key={c.campo} className="text-xs text-amber-700 flex items-center gap-1">
                  <span className="text-amber-400">•</span> {c.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
