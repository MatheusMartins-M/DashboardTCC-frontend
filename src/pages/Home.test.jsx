import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { chamadasPara, responder } from "../test/apiFalsa";
import { usuarioAdmin, usuarioComum } from "../test/dados";
import { renderApp } from "../test/renderApp";

describe("Home", () => {
  it("mostra métricas e só os painéis ativos", async () => {
    renderApp("/home");
    expect(await screen.findByText("Operação logística", { selector: ".home-panel-title" })).toBeInTheDocument();
    expect(screen.queryByText("Suporte N1")).not.toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("60s")).toBeInTheDocument();
    expect(screen.getByText("Administrador", { selector: ".stat-card-value" })).toBeInTheDocument();
  });

  it("abre um painel ao clicar no card", async () => {
    const { user } = renderApp("/home");
    await user.click(await screen.findByText("Financeiro", { selector: ".home-panel-title" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Operação logística" })).toBeInTheDocument();
  });

  it("navega pelos atalhos do topo e da configuração", async () => {
    const { user } = renderApp("/home");
    await user.click(await screen.findByRole("button", { name: /Histórico e alertas/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Histórico e alertas" })).toBeInTheDocument();
  });

  it("vai para rotação, novo painel e cards de configuração", async () => {
    const { user, unmount } = renderApp("/home");
    await user.click(await screen.findByRole("button", { name: /Rotação em tela cheia/ }));
    expect(await screen.findByRole("button", { name: /Pausar|Retomar/ })).toBeInTheDocument();
    unmount();

    const segundo = renderApp("/home");
    await segundo.user.click(await screen.findByRole("button", { name: /Novo painel/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Painéis" })).toBeInTheDocument();
    segundo.unmount();

    const terceiro = renderApp("/home");
    await terceiro.user.click(await screen.findByRole("button", { name: /^Perfis de acesso/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Perfis de acesso" })).toBeInTheDocument();
  });

  it("carrega a demonstração pelo banner", async () => {
    const { user } = renderApp("/home");
    await user.click(await screen.findByRole("button", { name: "Carregar demo" }));
    expect(await screen.findByText("Dados de demonstração carregados.")).toBeInTheDocument();
    expect(chamadasPara("post", "/demo/carregar/")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));
    expect(screen.queryByText("Dados de demonstração carregados.")).not.toBeInTheDocument();
  });

  it("estado vazio oferece criar painel e demonstração com erro", async () => {
    responder(
      { method: "get", url: /^\/paineis\/$/, data: [] },
      { method: "post", url: /^\/demo\/carregar\/$/, status: 500, data: { detail: "Falha ao gerar demo." } },
    );
    const { user } = renderApp("/home");
    expect(await screen.findByText("Nenhum painel cadastrado ainda")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Carregar demonstração/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao gerar demo.");
    await user.click(screen.getByRole("button", { name: /Criar primeiro painel/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Painéis" })).toBeInTheDocument();
  });

  it("falha ao listar painéis mostra estado vazio", async () => {
    responder({ method: "get", url: /^\/paineis\/$/, status: 500, data: {} });
    renderApp("/home");
    expect(await screen.findByText("Nenhum painel cadastrado ainda")).toBeInTheDocument();
  });

  it("usuário comum vê só o que tem permissão", async () => {
    responder({ method: "get", url: /^\/paineis\/$/, data: [] });
    renderApp("/home", { usuario: usuarioComum });
    expect(await screen.findByText("Assim que um administrador criar painéis, eles aparecerão aqui.")).toBeInTheDocument();
    expect(screen.queryByText("Configuração")).not.toBeInTheDocument();
    expect(screen.getByText("Usuário", { selector: ".stat-card-value" })).toBeInTheDocument();
  });

  it("usuário sem nenhuma permissão", async () => {
    renderApp("/home", { usuario: { ...usuarioComum, nome: "", organizacao: null, permissoes: [] } });
    expect(await screen.findByText("Nenhuma tela liberada")).toBeInTheDocument();
    expect(screen.getByText("Selecione um painel para começar a monitorar.")).toBeInTheDocument();
    expect(chamadasPara("get", "/paineis/")).toHaveLength(0);
  });

  it("admin sem organização continua funcionando", async () => {
    renderApp("/home", { usuario: { ...usuarioAdmin, organizacao: undefined } });
    expect(await screen.findByText("Selecione um painel para começar a monitorar.")).toBeInTheDocument();
  });
});
