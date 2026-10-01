import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { Cadastro } from "../pages/Cadastro";
import { Conexoes } from "../pages/Conexoes";
import { ConsultasApi } from "../pages/ConsultasApi";
import { ConsultasSql } from "../pages/ConsultasSql";
import { Historico } from "../pages/Historico";
import { Home } from "../pages/Home";
import { Login } from "../pages/Login";
import { PainelEditar } from "../pages/PainelEditar";
import { PainelRotacao } from "../pages/PainelRotacao";
import { PainelVisualizar } from "../pages/PainelVisualizar";
import { Paineis } from "../pages/Paineis";
import { Perfis } from "../pages/Perfis";
import { Seguranca } from "../pages/Seguranca";
import { Usuarios } from "../pages/Usuarios";
import { PermissaoRoute } from "./PermissaoRoute";
import { isAuthenticated } from "../services/authStorage";

function PrivateRoute() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      <Route element={<PrivateRoute />}>
        <Route path="/home" element={<Home />} />
        <Route path="/seguranca" element={<Seguranca />} />

        <Route element={<PermissaoRoute permissao="ver_paineis" />}>
          <Route path="/paineis/:id" element={<PainelVisualizar />} />
        </Route>

        <Route element={<PermissaoRoute permissao="ver_rotacao" />}>
          <Route path="/rotacao" element={<PainelRotacao />} />
        </Route>

        <Route element={<PermissaoRoute permissao="ver_historico" />}>
          <Route path="/historico" element={<Historico />} />
        </Route>

        <Route element={<PermissaoRoute permissao="gerenciar_paineis" />}>
          <Route path="/paineis" element={<Paineis />} />
          <Route path="/paineis/:id/editar" element={<PainelEditar />} />
        </Route>

        <Route element={<PermissaoRoute permissao="gerenciar_conexoes" />}>
          <Route path="/conexoes" element={<Conexoes />} />
        </Route>

        <Route element={<PermissaoRoute permissao="gerenciar_consultas_sql" />}>
          <Route path="/consultas-sql" element={<ConsultasSql />} />
        </Route>

        <Route element={<PermissaoRoute permissao="gerenciar_consultas_api" />}>
          <Route path="/consultas-api" element={<ConsultasApi />} />
        </Route>

        <Route element={<PermissaoRoute permissao="gerenciar_usuarios" />}>
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/perfis" element={<Perfis />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
