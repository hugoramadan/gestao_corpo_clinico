import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { ROLE_LABEL } from '../utils/roles';

export default function Navbar() {
  const { user, logout, isRole } = useAuth();
  const { nome, logoUrl } = useConfig();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="text-white shadow-md" style={{ backgroundColor: 'var(--color-primary)' }}>
      {/* Barra principal */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2" onClick={closeMenu}>
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-7 w-auto object-contain" />
          )}
          <span className="text-lg font-bold tracking-tight">{nome}</span>
        </Link>

        {/* Links de navegação — desktop */}
        <div className="hidden md:flex items-center gap-4">
          {isRole('gestor', 'admin') && (
            <Link to="/medicos" className="text-sm hover:underline">
              Médicos
            </Link>
          )}
          {isRole('medico') && (
            <Link to="/perfil" className="text-sm hover:underline">
              Meu Cadastro
            </Link>
          )}
          {isRole('gestor') && !isRole('admin') && (
            <Link to="/usuarios/novo" className="text-sm hover:underline">
              Novo Médico
            </Link>
          )}
          {isRole('admin') && (
            <Link to="/usuarios" className="text-sm hover:underline">
              Usuários
            </Link>
          )}
          {isRole('admin') && (
            <Link to="/configuracoes" className="text-sm hover:underline">
              Configurações
            </Link>
          )}
        </div>

        {/* Informações do usuário — desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/trocar-senha" className="text-xs opacity-70 hover:opacity-100 hover:underline">
            Trocar Senha
          </Link>
          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            {user?.nome} · {user?.roles.map((r) => ROLE_LABEL[r] ?? r).join(', ')}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm bg-white font-medium px-3 py-1 rounded hover:opacity-90 transition"
            style={{ color: 'var(--color-primary)' }}
          >
            Sair
          </button>
        </div>

        {/* Botão hambúrguer — mobile */}
        <button
          className="md:hidden p-2 rounded hover:bg-white/10 transition"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Abrir menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu mobile — colapsável */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/20 px-4 py-3 flex flex-col gap-1" style={{ backgroundColor: 'var(--color-primary)' }}>
          {/* Links de navegação */}
          {isRole('gestor', 'admin') && (
            <Link to="/medicos" onClick={closeMenu} className="text-sm py-2 hover:bg-white/10 px-2 rounded transition">
              Médicos
            </Link>
          )}
          {isRole('medico') && (
            <Link to="/perfil" onClick={closeMenu} className="text-sm py-2 hover:bg-white/10 px-2 rounded transition">
              Meu Cadastro
            </Link>
          )}
          {isRole('gestor') && !isRole('admin') && (
            <Link to="/usuarios/novo" onClick={closeMenu} className="text-sm py-2 hover:bg-white/10 px-2 rounded transition">
              Novo Médico
            </Link>
          )}
          {isRole('admin') && (
            <Link to="/usuarios" onClick={closeMenu} className="text-sm py-2 hover:bg-white/10 px-2 rounded transition">
              Usuários
            </Link>
          )}
          {isRole('admin') && (
            <Link to="/configuracoes" onClick={closeMenu} className="text-sm py-2 hover:bg-white/10 px-2 rounded transition">
              Configurações
            </Link>
          )}

          {/* Separador */}
          <div className="border-t border-white/20 my-2" />

          {/* Informações do usuário */}
          <span className="text-xs opacity-80 px-2 py-1">
            {user?.nome} · {user?.roles.map((r) => ROLE_LABEL[r] ?? r).join(', ')}
          </span>
          <Link to="/trocar-senha" onClick={closeMenu} className="text-sm py-2 hover:bg-white/10 px-2 rounded transition opacity-80 hover:opacity-100">
            Trocar Senha
          </Link>
          <button
            onClick={handleLogout}
            className="mt-1 text-sm bg-white font-medium px-3 py-2 rounded hover:opacity-90 transition text-left"
            style={{ color: 'var(--color-primary)' }}
          >
            Sair
          </button>
        </div>
      )}
    </nav>
  );
}
