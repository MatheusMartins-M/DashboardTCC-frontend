import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { chamadasPara, responder } from "../test/apiFalsa";
import { renderApp } from "../test/renderApp";
import { cancelarModal, confirmarModal, linhaDaTabela } from "../test/ui-helpers";

describe("Consultas SQL", () => {
  it("cria consulta em conexão real sem enviar dados mockados", async () => {
    const { user } = renderApp("/consultas-sql");
    await screen.findByText("Pedidos pendentes");
    await user.selectOptions(screen.getByLabelText("Conexão"), "1");
    await user.type(screen.getByLabelText("Nome"), "Nova");
    await user.type(screen.getByLabelText("Descrição"), "desc");
    await user.clear(screen.getByLabelText("Intervalo de execução (segundos)"));
    await user.type(screen.getByLabelText("Intervalo de execução (segundos)"), "60");
    await user.click(screen.getByRole("switch", { name: /Consulta ativa/ }));
    await user.click(screen.getByRole("button", { name: "Criar consulta" }));

    expect(await screen.findByText("Consulta criada.")).toBeInTheDocument();
    const body = chamadasPara("post", "/consultas-sql/")[0].body;
    expect(body).toMatchObject({ conexao: 1, nome: "Nova", intervalo_segundos: 60, ativo: false });
    expect(body).not.toHaveProperty("dados_mock");
  });

  it("com conexão mock exige lista JSON válida", async () => {
    const { user } = renderApp("/consultas-sql");
    await screen.findByText("Pedidos pendentes");
    await user.selectOptions(screen.getByLabelText("Conexão"), "3");
    await user.type(screen.getByLabelText("Nome"), "Mock");
    const dados = screen.getByLabelText("Dados mockados (JSON)");

    await user.clear(dados);
    await user.type(dados, "{{}");
    await user.click(screen.getByRole("button", { name: "Criar consulta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("O JSON deve ser uma lista de objetos.");

    await user.clear(dados);
    await user.type(dados, "nao-json");
    await user.click(screen.getByRole("button", { name: "Criar consulta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/JSON/);

    await user.clear(dados);
    await user.type(dados, "[[{{\"total\": 3}]");
    await user.click(screen.getByRole("button", { name: "Criar consulta" }));
    expect(await screen.findByText("Consulta criada.")).toBeInTheDocument();
    expect(chamadasPara("post", "/consultas-sql/")[0].body.dados_mock).toEqual([{ total: 3 }]);
  });

  it("edita consulta mock e real, e cancela a edição", async () => {
    const { user } = renderApp("/consultas-sql");
    await user.click((await linhaDaTabela("Demo mock")).getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Dados mockados (JSON)")).toHaveValue('[\n  {\n    "total": 5\n  }\n]');
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Consulta atualizada.")).toBeInTheDocument();
    expect(chamadasPara("put", "/consultas-sql/3/")).toHaveLength(1);

    await user.click((await linhaDaTabela("Carrinhos abandonados")).getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("heading", { name: "Editar consulta" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Nova consulta" })).toBeInTheDocument();
  });

  it("executa e mostra o resultado em tabela, vazio ou truncado", async () => {
    const { user } = renderApp("/consultas-sql");
    await user.click((await linhaDaTabela("Pedidos pendentes")).getByRole("button", { name: "Executar" }));
    expect(await screen.findByRole("heading", { name: "Resultado: Pedidos pendentes" })).toBeInTheDocument();
    expect(screen.getByText("1 linha(s) retornada(s)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar resultado" }));

    responder({ method: "post", url: /^\/consultas-sql\/2\/executar\/$/, data: { linhas: [], total_linhas: 0 } });
    await user.click((await linhaDaTabela("Carrinhos abandonados")).getByRole("button", { name: "Executar" }));
    expect(await screen.findByText("A consulta não retornou linhas")).toBeInTheDocument();

    responder({ method: "post", url: /^\/consultas-sql\/1\/executar\/$/, data: { linhas: [{ a: 1 }], total_linhas: 50 } });
    await user.click((await linhaDaTabela("Pedidos pendentes")).getByRole("button", { name: "Executar" }));
    expect(await screen.findByText("Exibindo 1 de 50 linhas")).toBeInTheDocument();

    responder({ method: "post", url: /^\/consultas-sql\/1\/executar\/$/, status: 400, data: { detail: "Apenas SELECT." } });
    await user.click((await linhaDaTabela("Pedidos pendentes")).getByRole("button", { name: "Executar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Apenas SELECT.");

    responder({ method: "post", url: /^\/consultas-sql\/1\/executar\/$/, status: 500, data: {} });
    await user.click((await linhaDaTabela("Pedidos pendentes")).getByRole("button", { name: "Executar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro ao executar consulta.");
  });

  it("exclui, cancela exclusão e trata falhas", async () => {
    const { user } = renderApp("/consultas-sql");
    const linha = await linhaDaTabela("Pedidos pendentes");
    await user.click(linha.getByRole("button", { name: "Editar" }));
    await user.click(linha.getByRole("button", { name: "Excluir" }));
    await cancelarModal(user);
    await user.click(linha.getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByText("Consulta excluída.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));

    responder({ method: "delete", url: /^\/consultas-sql\/2\/$/, status: 400, data: { detail: "Em uso." } });
    await user.click((await linhaDaTabela("Carrinhos abandonados")).getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Em uso.");
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));

    responder({ method: "post", url: /^\/consultas-sql\/$/, status: 400, data: { sql: ["Somente SELECT."] } });
    await user.selectOptions(screen.getByLabelText("Conexão"), "1");
    await user.type(screen.getByLabelText("Nome"), "X");
    await user.click(screen.getByRole("button", { name: "Criar consulta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("sql: Somente SELECT.");
  });

  it("estado vazio e falha ao carregar", async () => {
    responder({ method: "get", url: /^\/consultas-sql\/$/, data: [] });
    const { unmount } = renderApp("/consultas-sql");
    expect(await screen.findByText("Nenhuma consulta cadastrada")).toBeInTheDocument();
    unmount();

    responder({ method: "get", url: /^\/conexoes\/$/, status: 500, data: {} });
    renderApp("/consultas-sql");
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os dados.");
  });
});

describe("Consultas API", () => {
  it("cria consulta com headers JSON", async () => {
    const { user } = renderApp("/consultas-api");
    await screen.findByText("API de pagamentos");
    await user.type(screen.getByLabelText("Nome"), "Status");
    await user.selectOptions(screen.getByLabelText("Método HTTP"), "POST");
    await user.type(screen.getByLabelText("Requisição"), "https://x.dev/health");
    await user.type(screen.getByLabelText("Body"), "abc");
    await user.clear(screen.getByLabelText("Timeout (ms)"));
    await user.type(screen.getByLabelText("Timeout (ms)"), "500");
    await user.clear(screen.getByLabelText("Status esperado"));
    await user.type(screen.getByLabelText("Status esperado"), "204");
    await user.clear(screen.getByLabelText("Intervalo (s)"));
    await user.type(screen.getByLabelText("Intervalo (s)"), "90");
    await user.click(screen.getByRole("switch", { name: /Consulta ativa/ }));
    await user.click(screen.getByRole("button", { name: "Criar consulta" }));

    expect(await screen.findByText("Consulta API criada.")).toBeInTheDocument();
    expect(chamadasPara("post", "/consultas-api/")[0].body).toMatchObject({
      nome: "Status", metodo: "POST", url: "https://x.dev/health", body: "abc", headers: {}, timeout_ms: 500, status_esperado: 204, intervalo_segundos: 90, ativo: false,
    });
  });

  it("recusa headers inválidos", async () => {
    const { user } = renderApp("/consultas-api");
    await screen.findByText("API de pagamentos");
    await user.type(screen.getByLabelText("Nome"), "X");
    await user.type(screen.getByLabelText("Requisição"), "https://x.dev");
    await user.clear(screen.getByLabelText("Headers (JSON)"));
    await user.type(screen.getByLabelText("Headers (JSON)"), "nao-json");
    await user.click(screen.getByRole("button", { name: "Criar consulta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Headers devem ser um JSON válido.");
    expect(chamadasPara("post", "/consultas-api/")).toHaveLength(0);
  });

  it("edita, salva, trata erro e cancela", async () => {
    const { user } = renderApp("/consultas-api");
    await user.click((await linhaDaTabela("Webhook")).getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Headers (JSON)")).toHaveValue('{\n  "X-Key": "1"\n}');
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Consulta API atualizada.")).toBeInTheDocument();

    responder({ method: "put", url: /^\/consultas-api\/1\/$/, status: 400, data: { url: ["URL inválida."] } });
    await user.click((await linhaDaTabela("API de pagamentos")).getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("url: URL inválida.");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Nova consulta API" })).toBeInTheDocument();
  });

  it("testa endpoint com sucesso, falha de status e erro", async () => {
    const { user } = renderApp("/consultas-api");
    await user.click((await linhaDaTabela("API de pagamentos")).getByRole("button", { name: "Testar endpoint" }));
    expect(await screen.findByText("Sucesso")).toBeInTheDocument();
    expect(screen.getByText("87 ms")).toBeInTheDocument();
    expect(screen.getByText("Prévia da resposta")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar resultado" }));

    responder({ method: "post", url: /^\/consultas-api\/2\/testar\/$/, data: { sucesso: false, status_code: 500, status_esperado: 201 } });
    await user.click((await linhaDaTabela("Webhook")).getByRole("button", { name: "Testar endpoint" }));
    expect(await screen.findByText("Falha")).toBeInTheDocument();
    expect(screen.getByText("O status retornado difere do esperado")).toBeInTheDocument();

    responder({ method: "post", url: /^\/consultas-api\/2\/testar\/$/, status: 500, data: {} });
    await user.click((await linhaDaTabela("Webhook")).getByRole("button", { name: "Testar endpoint" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro ao testar API.");
  });

  it("exclui com confirmação e trata falhas", async () => {
    const { user } = renderApp("/consultas-api");
    const linha = await linhaDaTabela("API de pagamentos");
    await user.click(linha.getByRole("button", { name: "Editar" }));
    await user.click(linha.getByRole("button", { name: "Excluir" }));
    await cancelarModal(user);
    await user.click(linha.getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByText("Consulta API excluída.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));

    responder({ method: "delete", url: /^\/consultas-api\/2\/$/, status: 400, data: { detail: "Em uso." } });
    await user.click((await linhaDaTabela("Webhook")).getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Em uso.");
  });

  it("estado vazio e falha ao carregar", async () => {
    responder({ method: "get", url: /^\/consultas-api\/$/, data: [] });
    const { unmount } = renderApp("/consultas-api");
    expect(await screen.findByText("Nenhuma consulta API cadastrada")).toBeInTheDocument();
    unmount();

    responder({ method: "get", url: /^\/consultas-api\/$/, status: 500, data: {} });
    renderApp("/consultas-api");
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as consultas API.");
  });
});
