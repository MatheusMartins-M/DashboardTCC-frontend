import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usuarioComum } from "./dados";
import { renderApp } from "./renderApp";

describe("rotas", () => {
  it.each([
    ["/home", /Boa (noite|tarde), Ana|Bom dia, Ana/],
    ["/paineis/1", "Operação logística"],
    ["/rotacao", "Operação logística"],
    ["/historico", "Histórico e alertas"],
    ["/paineis", "Painéis"],
    ["/paineis/1/editar", "Itens do painel"],
    ["/conexoes", "Conexões de banco"],
    ["/consultas-sql", "Consultas SQL"],
    ["/consultas-api", "Consultas API"],
    ["/usuarios", "Usuários"],
    ["/perfis", "Perfis de acesso"],
  ])("abre %s", async (rota, titulo) => {
    renderApp(rota);
    expect(await screen.findByRole("heading", { level: 1, name: titulo })).toBeInTheDocument();
  });

  it("redireciona para o login quando não autenticado", async () => {
    renderApp("/conexoes", { autenticado: false });
    expect(await screen.findByRole("button", { name: /Entrar/ })).toBeInTheDocument();
  });

  it("redireciona para a home quando falta permissão", async () => {
    renderApp("/conexoes", { usuario: usuarioComum });
    expect(await screen.findByRole("heading", { level: 1, name: /Bruno/ })).toBeInTheDocument();
  });

  it("rota desconhecida vai para o login", async () => {
    renderApp("/nao-existe", { autenticado: false });
    expect(await screen.findByRole("button", { name: /Entrar/ })).toBeInTheDocument();
  });
});
