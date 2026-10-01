import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ConfirmDialogProvider } from "../context/ConfirmDialogContext";
import { AppRoutes } from "../routes/AppRoutes";
import { saveAuth } from "../services/authStorage";
import { usuarioAdmin } from "./dados";

export function autenticar(usuario = usuarioAdmin) {
  saveAuth({ access: "token-acesso", refresh: "token-refresh", usuario });
}

export function renderApp(rota, { usuario = usuarioAdmin, autenticado = true } = {}) {
  if (autenticado) autenticar(usuario);
  const user = userEvent.setup();
  const resultado = render(
    <MemoryRouter initialEntries={[rota]}>
      <ConfirmDialogProvider>
        <AppRoutes />
      </ConfirmDialogProvider>
    </MemoryRouter>,
  );
  return { user, ...resultado };
}
