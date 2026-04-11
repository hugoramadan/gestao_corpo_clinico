import { useRef, useState } from 'react';

const MAX_SIZE_MB = 4;

interface Props {
  label: string;
  name: string;
  accept?: string;
  currentUrl?: string | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  maxSizeMB?: number;
}

export default function FileUploadField({ label, name, accept, currentUrl, onChange, required, maxSizeMB = MAX_SIZE_MB }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sizeError, setSizeError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > (maxSizeMB * 1024 * 1024)) {
      setSizeError(`Arquivo muito grande. Máximo permitido: ${maxSizeMB} MB.`);
      setFileName('');
      onChange(null);
      // Limpa o input para permitir reselecionar o mesmo arquivo
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setSizeError('');
    setFileName(file?.name ?? '');
    onChange(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm px-3 py-2 rounded-lg transition"
        >
          Selecionar arquivo
        </button>
        <span className={`text-sm truncate max-w-xs ${sizeError ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
          {sizeError || fileName || (currentUrl ? 'Arquivo atual' : 'Nenhum arquivo selecionado')}
        </span>
        {currentUrl && !fileName && !sizeError && (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline ml-1"
          >
            Ver
          </a>
        )}
      </div>
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
