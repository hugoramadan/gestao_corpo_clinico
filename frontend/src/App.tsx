import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Registro from './pages/Registro';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import MedicoLista from './pages/MedicoLista';
import MedicoDetalhe from './pages/MedicoDetalhe';
import MedicoEditar from './pages/MedicoEditar';
import TrocarSenha from './pages/TrocarSenha';
import UsuarioLista from './pages/UsuarioLista';
import UsuarioNovo from './pages/UsuarioNovo';
import UsuarioEditar from './pages/UsuarioEditar';
import Configuracoes from './pages/Configuracoes';

export default function App() {
  return (
    <ConfigProvider>
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Registro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />

          {/* Protegidas — todos os perfis */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/trocar-senha" element={<ProtectedRoute><TrocarSenha /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute roles={['medico']}><Perfil /></ProtectedRoute>} />

          {/* Médico detalhe — médico só vê o próprio (proteção no backend) */}
          <Route path="/medicos/:id" element={<ProtectedRoute><MedicoDetalhe /></ProtectedRoute>} />
          <Route path="/medicos/:id/editar" element={<ProtectedRoute><MedicoEditar /></ProtectedRoute>} />

          {/* Gestor / Admin */}
          <Route path="/medicos" element={<ProtectedRoute roles={['gestor', 'admin']}><MedicoLista /></ProtectedRoute>} />

          {/* Admin — gerenciamento de usuários */}
          <Route path="/usuarios" element={<ProtectedRoute roles={['admin']}><UsuarioLista /></ProtectedRoute>} />
          <Route path="/usuarios/novo" element={<ProtectedRoute roles={['admin', 'gestor']}><UsuarioNovo /></ProtectedRoute>} />
          <Route path="/usuarios/:id/editar" element={<ProtectedRoute roles={['admin']}><UsuarioEditar /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute roles={['admin']}><Configuracoes /></ProtectedRoute>} />

          {/* Redirect raiz */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ConfigProvider>
  );
}
