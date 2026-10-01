import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CriticidadeBadge } from "../components/PainelGrid";
import { getAccessToken } from "../services/authStorage";
import { chamadasPara, responder } from "../test/apiFalsa";
import { execucaoPainel, paineis, usuarioComum } from "../test/dados";
import { renderApp } from "../test/renderApp";

describe("Painel ao vivo", () => {
  it("mostra os cards com valor, criticidade, erro e tabela", async () => {
    renderApp("/paineis/1");
    expect(await screen.findByRole("heading", { level: 1, name: "Operação logística" })).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText("Falha")).toBeInTheDocument();
    expect(screen.getByText("Timeout ao conectar")).toBeInTheDocument();
    expect(screen.getByText("Mercado Bom")).toBeInTheDocument();
    expect(screen.getByText(/Ao vivo · atualiza a cada 60s/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Editar itens/ })).toBeInTheDocument();
  });

  it("atualiza manualmente e automaticamente", async () => {
    responder({ method: "get", url: /^\/paineis\/\d+\/executar\/$/, data: { ...execucaoPainel, intervalo_segundos: 1 } });
    const { user } = renderApp("/paineis/1");
    await screen.findByText("128");
    const execucoes = () => chamadasPara("get", "/paineis/1/executar/").length;

    await user.click(screen.getByRole("button", { name: /Atualizar/ }));
    expect(execucoes()).toBe(2);
    await waitFor(() => expect(execucoes()).toBeGreaterThanOrEqual(3), { timeout: 2500 });
  });

  it("mostra erro quando a execução falha e painel sem itens", async () => {
    responder({ method: "get", url: /^\/paineis\/\d+\/executar\/$/, status: 500, data: {} });
    const { user } = renderApp("/paineis/1");
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o painel.");
    expect(screen.getByText("Nenhum item neste painel")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("usuário sem gestão não vê o atalho de edição", async () => {
    responder({ method: "get", url: /^\/paineis\/\d+\/executar\/$/, data: { painel_nome: "", itens: [] } });
    renderApp("/paineis/1", { usuario: usuarioComum });
    expect(await screen.findByRole("heading", { level: 1, name: "Painel" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Editar itens/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByRole("link", { name: /Histórico/ })).toBeInTheDocument();
  });

  it("badge de criticidade com nível desconhecido", () => {
    render(<><CriticidadeBadge nivel="outro" /><CriticidadeBadge /></>);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Indefinido")).toBeInTheDocument();
  });
});

describe("Rotação", () => {
  afterEach(() => {
    delete document.fullscreenElement;
  });

  it("alterna painéis automaticamente, pausa e navega manualmente", async () => {
    responder({
      method: "get",
      url: /^\/paineis\/\d+\/executar\/$/,
      data: ({ url }) => ({ ...execucaoPainel, painel_nome: url.includes("/2/") ? "Financeiro" : "Operação logística" }),
    });
    renderApp("/rotacao");
    expect(await screen.findByText("Rotação · painel 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Próximo em 20s")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Intervalo da rotação em segundos"), { target: { value: "1" } });
    expect(await screen.findByText("Rotação · painel 2 de 2", {}, { timeout: 2500 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pausar rotação" }));
    expect(screen.getByText("Pausado")).toBeInTheDocument();
    const indiceAtual = screen.getByText(/Rotação · painel \d de 2/).textContent;
    await act(() => new Promise((resolve) => { setTimeout(resolve, 1300); }));
    expect(screen.getByText(/Rotação · painel \d de 2/).textContent).toBe(indiceAtual);

    fireEvent.change(screen.getByLabelText("Intervalo da rotação em segundos"), { target: { value: "" } });
    expect(screen.getByLabelText("Intervalo da rotação em segundos")).toHaveValue(20);
    fireEvent.click(screen.getByRole("button", { name: "Retomar rotação" }));

    fireEvent.click(screen.getByRole("button", { name: "Ir para Operação logística" }));
    expect(screen.getByText("Rotação · painel 1 de 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Próximo painel" }));
    expect(screen.getByText("Rotação · painel 2 de 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Painel anterior" }));
    expect(screen.getByText("Rotação · painel 1 de 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Painel anterior" }));
    expect(screen.getByText("Rotação · painel 2 de 2")).toBeInTheDocument();
  });

  it("atualiza dados, entra e sai da tela cheia", async () => {
    document.documentElement.requestFullscreen = vi.fn(async () => {
      document.fullscreenElement = document.documentElement;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    document.exitFullscreen = vi.fn(async () => {
      document.fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    const { user } = renderApp("/rotacao");
    await screen.findByText("Rotação · painel 1 de 2");
    await user.click(screen.getByRole("button", { name: "Tela cheia" }));
    expect(await screen.findByRole("button", { name: "Sair da tela cheia" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sair da tela cheia" }));
    expect(await screen.findByRole("button", { name: "Tela cheia" })).toBeInTheDocument();

    const antes = chamadasPara("get", "/paineis/1/executar/").length;
    await user.click(screen.getByTitle("Atualizar dados"));
    expect(chamadasPara("get", "/paineis/1/executar/").length).toBe(antes + 1);

    responder({ method: "get", url: /^\/paineis\/\d+\/executar\/$/, status: 500, data: {} });
    await user.click(screen.getByTitle("Atualizar dados"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao atualizar o painel em rotação.");
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));
  });

  it("mostra erro quando a execução inicial falha", async () => {
    responder({ method: "get", url: /^\/paineis\/\d+\/executar\/$/, status: 500, data: {} });
    renderApp("/rotacao");
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao atualizar o painel em rotação.");
  });

  it("sem painéis ativos ou com falha ao listar", async () => {
    responder({ method: "get", url: /^\/paineis\/$/, data: [paineis[2]] });
    const { unmount } = renderApp("/rotacao");
    expect(await screen.findByText("Nenhum painel ativo para rotação")).toBeInTheDocument();
    unmount();

    responder({ method: "get", url: /^\/paineis\/$/, status: 500, data: {} });
    renderApp("/rotacao");
    expect(await screen.findByText("Nenhum painel ativo para rotação")).toBeInTheDocument();
  });
});

describe("Histórico", () => {
  it("mostra resumo, registros e aplica filtros", async () => {
    const { user } = renderApp("/historico");
    expect(await screen.findByText("Títulos vencidos")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filtrar por painel"), "2");
    await user.click(screen.getByRole("switch", { name: "Somente alertas" }));
    const ultima = chamadasPara("get", "/historico/").at(-1);
    expect(ultima.params).toEqual({ painel: "2", apenas_alertas: "1" });

    await user.click(screen.getByRole("button", { name: /Atualizar/ }));
    expect(chamadasPara("get", "/historico/resumo/").length).toBeGreaterThanOrEqual(4);
  });

  it("estado vazio com e sem filtros, e valores ausentes", async () => {
    responder(
      { method: "get", url: /^\/historico\/$/, data: [] },
      { method: "get", url: /^\/historico\/resumo\/$/, data: { total_registros: 0, total_alertas: 0, total_erros: 0 } },
    );
    const { user } = renderApp("/historico");
    expect(await screen.findByText(/Abra um painel para gerar histórico/)).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Somente alertas" }));
    expect(await screen.findByText("Nenhuma execução corresponde aos filtros selecionados.")).toBeInTheDocument();
  });

  it("mostra erro ao carregar e tolera falha na lista de painéis", async () => {
    responder(
      { method: "get", url: /^\/historico\/$/, data: [{ id: 9, executado_em: "2026-01-01T00:00:00Z", painel_nome: "", item_titulo: "X", valor: null, criticidade_nivel: null }] },
      { method: "get", url: /^\/paineis\/$/, status: 500, data: {} },
    );
    const { user, unmount } = renderApp("/historico");
    expect(await screen.findByText("Indefinido")).toBeInTheDocument();
    expect(screen.getByText("P")).toBeInTheDocument();
    unmount();

    responder({ method: "get", url: /^\/historico\/resumo\/$/, status: 500, data: {} });
    renderApp("/historico");
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o histórico.");
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));
  });
});

describe("Menu lateral", () => {
  it("lista painéis ativos, recolhe e sai", async () => {
    const { user } = renderApp("/conexoes");
    const menu = within(screen.getByRole("navigation", { name: "Menu principal" }));
    expect(await menu.findByRole("link", { name: /Operação logística/ })).toBeInTheDocument();
    expect(menu.queryByRole("link", { name: /Suporte N1/ })).not.toBeInTheDocument();
    expect(screen.getByText("Acme Logística")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Recolher menu" }));
    expect(screen.getByRole("navigation", { name: "Menu principal" })).toHaveClass("collapsed");
    expect(localStorage.getItem("sidebarCollapsed")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Expandir menu" }));
    expect(localStorage.getItem("sidebarCollapsed")).toBe("false");

    await user.click(screen.getByRole("button", { name: "Sair" }));
    expect(await screen.findByRole("button", { name: /Entrar/ })).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });

  it("começa recolhido quando salvo e mostra falta de painéis", async () => {
    localStorage.setItem("sidebarCollapsed", "true");
    responder({ method: "get", url: /^\/paineis\/$/, data: [] });
    const { unmount } = renderApp("/historico", { usuario: usuarioComum });
    expect(screen.getByRole("navigation", { name: "Menu principal" })).toHaveClass("collapsed");
    unmount();

    localStorage.clear();
    responder({ method: "get", url: /^\/paineis\/$/, status: 500, data: {} });
    renderApp("/historico", { usuario: { ...usuarioComum, organizacao: null, nome: "", tipo_permissao: "X", email: "" } });
    expect(await screen.findByText("Nenhum painel ativo")).toBeInTheDocument();
    expect(screen.getByText("Plataforma de monitoramento")).toBeInTheDocument();
    expect(screen.getByText("Conectado")).toBeInTheDocument();
    expect(screen.queryByText("Administração")).not.toBeInTheDocument();
  });

  it("recolhe automaticamente em telas pequenas", async () => {
    const original = window.matchMedia;
    window.matchMedia = (query) => ({ ...original(query), matches: true });
    renderApp("/home");
    expect(screen.getByRole("navigation", { name: "Menu principal" })).toHaveClass("collapsed");
    window.matchMedia = original;
  });
});
