import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { chamadasPara, responder } from "../test/apiFalsa";
import { itensPainel } from "../test/dados";
import { renderApp } from "../test/renderApp";
import { cancelarModal, confirmarModal, linhaDaTabela } from "../test/ui-helpers";

describe("Painéis", () => {
  it("cria um painel e abre a tela de itens", async () => {
    const { user } = renderApp("/paineis");
    await linhaDaTabela("Financeiro");
    await user.type(screen.getByLabelText("Nome"), "Novo");
    await user.type(screen.getByLabelText("Descrição"), "desc");
    await user.clear(screen.getByLabelText("Intervalo de atualização (segundos)"));
    await user.type(screen.getByLabelText("Intervalo de atualização (segundos)"), "30");
    await user.click(screen.getByRole("switch", { name: /Painel ativo/ }));
    await user.click(screen.getByRole("button", { name: "Criar painel" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Itens do painel" })).toBeInTheDocument();
    expect(chamadasPara("post", "/paineis/")[0].body).toEqual({ nome: "Novo", descricao: "desc", intervalo_segundos: 30, ativo: false });
  });

  it("edita, cancela e trata erro ao salvar", async () => {
    const { user } = renderApp("/paineis");
    await user.click((await linhaDaTabela("Financeiro")).getByRole("button", { name: "Editar painel" }));
    expect(screen.getByRole("heading", { name: "Editar painel" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Painel atualizado.")).toBeInTheDocument();
    expect(chamadasPara("put", "/paineis/2/")[0].body).toMatchObject({ nome: "Financeiro", descricao: "" });

    responder({ method: "put", url: /^\/paineis\/1\/$/, status: 400, data: { nome: ["Já existe."] } });
    await user.click((await linhaDaTabela("Operação logística")).getByRole("button", { name: "Editar painel" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("nome: Já existe.");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Novo painel" })).toBeInTheDocument();
  });

  it("exclui com confirmação e trata falha", async () => {
    const { user } = renderApp("/paineis");
    const linha = await linhaDaTabela("Financeiro");
    await user.click(linha.getByRole("button", { name: "Editar painel" }));
    await user.click(linha.getByRole("button", { name: "Excluir" }));
    await cancelarModal(user);
    await user.click(linha.getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByText("Painel excluído.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));

    responder({ method: "delete", url: /^\/paineis\/3\/$/, status: 500, data: {} });
    await user.click((await linhaDaTabela("Suporte N1")).getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro ao excluir painel.");
  });

  it("estado vazio e falha ao carregar", async () => {
    responder({ method: "get", url: /^\/paineis\/$/, data: [] });
    const { unmount } = renderApp("/paineis");
    expect(await screen.findByText("Nenhum painel cadastrado")).toBeInTheDocument();
    unmount();

    responder({ method: "get", url: /^\/paineis\/$/, status: 500, data: {} });
    renderApp("/paineis");
    expect(await screen.findByText("Não foi possível carregar os painéis.")).toBeInTheDocument();
  });
});

describe("Itens do painel", () => {
  it("adiciona item SQL com prévia das regras", async () => {
    const { user } = renderApp("/paineis/1/editar");
    await screen.findByRole("heading", { level: 1, name: "Itens do painel" });
    expect(screen.getByText("até 10")).toBeInTheDocument();
    expect(screen.getByText("acima")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Título do card"), "Novo card");
    await user.selectOptions(screen.getByLabelText("Consulta SQL"), "1");
    await user.type(screen.getByLabelText("Campo para valor"), "total");
    await user.clear(screen.getByLabelText("Ordem de exibição"));
    await user.type(screen.getByLabelText("Ordem de exibição"), "3");
    await user.click(screen.getByRole("switch", { name: /Item ativo no painel/ }));
    await user.click(screen.getByRole("button", { name: "Adicionar item" }));

    expect(await screen.findByText("Item adicionado.")).toBeInTheDocument();
    expect(chamadasPara("post", "/painel-itens/")[0].body).toMatchObject({
      painel: 1, titulo: "Novo card", tipo: "sql", formato: "numero", campo_valor: "total", ordem: 3, ativo: false, consulta_sql: 1, consulta_api: null,
    });
  });

  it("adiciona item API e formato tabela", async () => {
    const { user } = renderApp("/paineis/1/editar");
    await screen.findByRole("heading", { level: 1, name: "Itens do painel" });
    await user.click(screen.getByRole("radio", { name: "Tabela" }));
    expect(screen.queryByLabelText("Campo para valor")).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Consulta API" }));
    await user.type(screen.getByLabelText("Título do card"), "API");
    await user.selectOptions(screen.getByLabelText("Consulta API"), "1");
    await user.click(screen.getByRole("button", { name: "Adicionar item" }));
    await screen.findByText("Item adicionado.");
    expect(chamadasPara("post", "/painel-itens/")[0].body).toMatchObject({ tipo: "api", consulta_api: 1, consulta_sql: null });
  });

  it("valida o JSON das regras", async () => {
    const { user } = renderApp("/paineis/1/editar");
    await screen.findByRole("heading", { level: 1, name: "Itens do painel" });
    const regras = screen.getByLabelText(/Regras de cor/);

    fireEvent.change(regras, { target: { value: "{ quebrado" } });
    expect(screen.getByText(/JSON inválido/)).toBeInTheDocument();

    fireEvent.change(regras, { target: { value: "[]" } });
    expect(screen.queryByText(/JSON inválido/)).not.toBeInTheDocument();

    fireEvent.change(regras, { target: { value: '[{"ate": 1}]' } });
    expect(screen.getByText("Sem rótulo")).toBeInTheDocument();

    fireEvent.change(regras, { target: { value: '{"ate": 1}' } });
    await user.type(screen.getByLabelText("Título do card"), "X");
    await user.selectOptions(screen.getByLabelText("Consulta SQL"), "1");
    await user.click(screen.getByRole("button", { name: "Adicionar item" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Regras de cor devem ser um JSON válido (uma lista).");
  });

  it("edita item existente, usa regras padrão quando vazio e cancela", async () => {
    responder({ method: "get", url: /^\/painel-itens\//, data: [...itensPainel, { ...itensPainel[0], id: 5, titulo: "Status", formato: "status", regras_cor: null }] });
    const { user } = renderApp("/paineis/1/editar");
    await user.click((await linhaDaTabela("Pedidos pendentes")).getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Campo para valor")).toHaveValue("total");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Item atualizado.")).toBeInTheDocument();

    await user.click((await linhaDaTabela("Status")).getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("radio", { name: "Número" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("até 50")).toBeInTheDocument();

    await user.click((await linhaDaTabela("Pagamentos")).getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Consulta API")).toHaveValue("1");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Novo item" })).toBeInTheDocument();
  });

  it("trata erro ao salvar e exclui item", async () => {
    responder({ method: "post", url: /^\/painel-itens\/$/, status: 400, data: { titulo: ["Obrigatório."] } });
    const { user } = renderApp("/paineis/1/editar");
    await screen.findByRole("heading", { level: 1, name: "Itens do painel" });
    await user.type(screen.getByLabelText("Título do card"), "X");
    await user.selectOptions(screen.getByLabelText("Consulta SQL"), "1");
    await user.click(screen.getByRole("button", { name: "Adicionar item" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("titulo: Obrigatório.");
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));

    const linha = await linhaDaTabela("Pedidos pendentes");
    await user.click(linha.getByRole("button", { name: "Editar" }));
    await user.click(linha.getByRole("button", { name: "Excluir" }));
    await cancelarModal(user);
    await user.click(linha.getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByText("Item excluído.")).toBeInTheDocument();

    responder({ method: "delete", url: /^\/painel-itens\/2\/$/, status: 500, data: {} });
    await user.click((await linhaDaTabela("Pagamentos")).getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro ao excluir item.");
  });

  it("painel sem itens e falha ao carregar", async () => {
    responder({ method: "get", url: /^\/painel-itens\//, data: [] });
    const { unmount } = renderApp("/paineis/1/editar");
    expect(await screen.findByText("Nenhum item no painel")).toBeInTheDocument();
    unmount();

    responder({ method: "get", url: /^\/paineis\/\d+\/$/, status: 500, data: {} });
    renderApp("/paineis/1/editar");
    expect(await screen.findByText("Não foi possível carregar o painel.")).toBeInTheDocument();
  });
});
