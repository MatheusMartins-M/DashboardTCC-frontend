import { Navigate, Outlet } from "react-router-dom";
import { hasPermissao, isAuthenticated } from "../services/authStorage";

export function PermissaoRoute({ permissao }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!hasPermissao(permissao)) return <Navigate to="/home" replace />;
  return <Outlet />;
}
