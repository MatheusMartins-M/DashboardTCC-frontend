import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { chamadasPara, responder } from "../test/apiFalsa";
import { renderApp } from "../test/renderApp";
import { cancelarModal, confirmarModal, linhaDaTabela } from "../test/ui-helpers";

describe("Conexões", () => {
  it("lista as conexões com endereço ou indicação de mock", async () => {
    renderApp("/conexoes");
    expect(await screen.findByText("10.0.0.12:1433/erp")).toBeInTheDocument();
    expect(screen.getByText("dados fictícios")).toBeInTheDocument();
  });

  it("cria uma conexão SQL Server e troca a porta ao mudar o tipo", async () => {
    const { user } = renderApp("/conexoes");
    await screen.findByText("ERP Produção");
    await user.type(screen.getByLabelText("Nome"), "Nova");
    await user.click(screen.getByRole("radio", { name: "MySQL" }));
    expect(screen.getByLabelText("Porta")).toHaveValue(3306);
    await user.type(screen.getByLabelText("Host"), "db.local");
    await user.type(screen.getByLabelText("Banco"), "vendas");
    await user.type(screen.getByLabelText("Usuário"), "ro");
    await user.type(screen.getByLabelText("Senha"), "123");
    await user.click(screen.getByRole("switch", { name: /Conexão ativa/ }));
    await user.click(screen.getByRole("button", { name: "Criar conexão" }));

    expect(await screen.findByText("Conexão criada.")).toBeInTheDocument();
    expect(chamadasPara("post", "/conexoes/")[0].body).toEqual({
      nome: "Nova", tipo: "mysql", host: "db.local", porta: 3306, banco: "vendas", usuario: "ro", senha: "123", ativo: false,
    });
  });

  it("cria uma conexão mock sem host nem senha", async () => {
    const { user } = renderApp("/conexoes");
    await screen.findByText("ERP Produção");
    await user.type(screen.getByLabelText("Nome"), "Fake");
    await user.click(screen.getByRole("radio", { name: "Mock" }));
    expect(screen.queryByLabelText("Host")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Criar conexão" }));
    await screen.findByText("Conexão criada.");
    const body = chamadasPara("post", "/conexoes/")[0].body;
    expect(body).toMatchObject({ tipo: "mock", host: "local", banco: "mock", usuario: "mock", porta: 0 });
    expect(body).not.toHaveProperty("senha");
  });

  it("edita mantendo a senha atual e permite cancelar", async () => {
    const { user } = renderApp("/conexoes");
    const linha = await linhaDaTabela("ERP Produção");
    await user.click(linha.getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("heading", { name: "Editar conexão" })).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toHaveAttribute("placeholder", "Manter atual");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Conexão atualizada.")).toBeInTheDocument();
    expect(chamadasPara("put", "/conexoes/1/")[0].body).not.toHaveProperty("senha");

    await user.click((await linhaDaTabela("E-commerce")).getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Nova conexão" })).toBeInTheDocument();
  });

  it("mostra o erro de validação da API ao salvar", async () => {
    responder({ method: "put", url: /^\/conexoes\/1\/$/, status: 400, data: { host: ["Host inválido."] } });
    const { user } = renderApp("/conexoes");
    await user.click((await linhaDaTabela("ERP Produção")).getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("host: Host inválido.");
  });

  it("exclui após confirmar, ignora quando cancelado e trata erro", async () => {
    const { user } = renderApp("/conexoes");
    const linha = await linhaDaTabela("ERP Produção");
    await user.click(linha.getByRole("button", { name: "Editar" }));

    await user.click(linha.getByRole("button", { name: "Excluir" }));
    await cancelarModal(user);
    expect(chamadasPara("delete", /conexoes/)).toHaveLength(0);

    await user.click(linha.getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByText("Conexão excluída.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nova conexão" })).toBeInTheDocument();

    responder({ method: "delete", url: /^\/conexoes\/2\/$/, status: 409, data: { detail: "Conexão em uso." } });
    await user.click((await linhaDaTabela("E-commerce")).getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Conexão em uso.");
  });

  it("testa a conexão com sucesso e com falha", async () => {
    const { user } = renderApp("/conexoes");
    await user.click((await linhaDaTabela("ERP Produção")).getByRole("button", { name: "Testar conexão" }));
    expect(await screen.findByText("Conexão estabelecida.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));

    responder({ method: "post", url: /^\/conexoes\/2\/testar\/$/, status: 400, data: {} });
    await user.click((await linhaDaTabela("E-commerce")).getByRole("button", { name: "Testar conexão" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha no teste de conexão.");
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    responder({ method: "post", url: /^\/conexoes\/1\/testar\/$/, data: {} });
    await user.click((await linhaDaTabela("ERP Produção")).getByRole("button", { name: "Testar conexão" }));
    expect(await screen.findByText("Conexão OK.")).toBeInTheDocument();
  });

  it("estado vazio e erro ao carregar", async () => {
    responder({ method: "get", url: /^\/conexoes\/$/, data: [] });
    const { unmount } = renderApp("/conexoes");
    expect(await screen.findByText("Nenhuma conexão cadastrada")).toBeInTheDocument();
    unmount();

    responder({ method: "get", url: /^\/conexoes\/$/, status: 500, data: {} });
    renderApp("/conexoes");
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as conexões.");
  });
});
