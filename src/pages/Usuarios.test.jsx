import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { chamadasPara, responder } from "../test/apiFalsa";
import { renderApp } from "../test/renderApp";
import { cancelarModal, confirmarModal, linhaDaTabela } from "../test/ui-helpers";

async function preencherBasico(user) {
  await user.type(screen.getByLabelText("Nome"), "Eva");
  await user.type(screen.getByLabelText("E-mail"), "eva@acme.com");
  await user.type(screen.getByLabelText("Senha"), "segredo1");
}

describe("Usuários", () => {
  it("lista usuários com o tipo de acesso e marca o usuário logado", async () => {
    renderApp("/usuarios");
    const bruno = await linhaDaTabela("Bruno Lima");
    expect(bruno.getByText("Visualizador")).toBeInTheDocument();
    expect((await linhaDaTabela("Carla Mendes")).getByText("Personalizado")).toBeInTheDocument();
    expect((await linhaDaTabela("Diego Rocha")).getByText("—")).toBeInTheDocument();
    const ana = within(screen.getByText("você").closest("tr"));
    expect(ana.getByText("Administrador")).toBeInTheDocument();
    expect(ana.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
  });

  it("convida usuário com perfil pronto", async () => {
    const { user } = renderApp("/usuarios");
    await linhaDaTabela("Bruno Lima");
    await preencherBasico(user);
    await user.click(screen.getByRole("radio", { name: "Perfil pronto" }));
    expect(screen.getByLabelText("Perfil")).toHaveValue("1");
    await user.selectOptions(screen.getByLabelText("Perfil"), "3");
    await user.click(screen.getByRole("switch", { name: /Usuário ativo/ }));
    await user.click(screen.getByRole("button", { name: "Convidar usuário" }));

    expect(await screen.findByText(/Usuário criado/)).toBeInTheDocument();
    expect(chamadasPara("post", "/usuarios/")[0].body).toEqual({
      nome: "Eva", email: "eva@acme.com", senha: "segredo1", tipo_permissao: "USER", ativo: false, perfil_id: 3,
    });
  });

  it("convida usuário com permissões personalizadas usando busca e grupos", async () => {
    const { user } = renderApp("/usuarios");
    await linhaDaTabela("Bruno Lima");
    await preencherBasico(user);
    await user.click(screen.getByRole("radio", { name: "Personalizado" }));

    expect(screen.getByText("Nenhuma permissão neste grupo.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Desmarcar todas" }));
    await user.click(screen.getAllByRole("button", { name: "Marcar todas" })[1]);
    await user.click(screen.getByRole("button", { name: "Desmarcar todas" }));
    await user.click(screen.getByRole("checkbox", { name: "Conexões" }));
    await user.click(screen.getByRole("checkbox", { name: "Ver painéis" }));
    await user.click(screen.getByRole("checkbox", { name: "Ver painéis" }));

    await user.type(screen.getByPlaceholderText("Buscar permissão..."), "rotação");
    expect(screen.queryByRole("checkbox", { name: "Conexões" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Rotação de painéis" }));
    await user.clear(screen.getByPlaceholderText("Buscar permissão..."));
    await user.type(screen.getByPlaceholderText("Buscar permissão..."), "inexistente");
    expect(screen.getByText("Nenhuma permissão encontrada para a busca.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Convidar usuário" }));
    await screen.findByText(/Usuário criado/);
    const body = chamadasPara("post", "/usuarios/")[0].body;
    expect(body.perfil_id).toBeNull();
    expect(body.permissoes).toEqual(expect.arrayContaining(["gerenciar_conexoes", "ver_rotacao"]));
  });

  it("convida administrador sem perfil nem permissões", async () => {
    const { user } = renderApp("/usuarios");
    await linhaDaTabela("Bruno Lima");
    await preencherBasico(user);
    await user.click(screen.getByRole("radio", { name: "Administrador" }));
    expect(screen.getByText(/Administradores têm acesso total/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Convidar usuário" }));
    await screen.findByText(/Usuário criado/);
    expect(chamadasPara("post", "/usuarios/")[0].body).toEqual({
      nome: "Eva", email: "eva@acme.com", senha: "segredo1", tipo_permissao: "ADMIN", ativo: true,
    });
  });

  it("edita usuários de cada tipo e volta de admin para usuário", async () => {
    const { user } = renderApp("/usuarios");
    await user.click((await linhaDaTabela("Carla Mendes")).getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("radio", { name: "Personalizado" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("checkbox", { name: "Histórico e alertas" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Perfil pronto" }));
    expect(screen.getByLabelText("Perfil")).toHaveValue("1");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Usuário atualizado.")).toBeInTheDocument();
    expect(chamadasPara("put", "/usuarios/3/")[0].body).not.toHaveProperty("senha");

    await user.click((await linhaDaTabela("Diego Rocha")).getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("checkbox", { name: "Ver painéis" })).toBeChecked();

    const ana = within(screen.getByText("você").closest("tr"));
    await user.click(ana.getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("radio", { name: "Administrador" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("radio", { name: "Usuário" }));
    expect(screen.getByLabelText("Perfil")).toHaveValue("1");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Convidar usuário" })).toBeInTheDocument();
  });

  it("exige perfil quando não há perfis cadastrados", async () => {
    responder({ method: "get", url: /^\/perfis\/$/, data: [] });
    const { user } = renderApp("/usuarios");
    await user.click((await linhaDaTabela("Bruno Lima")).getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("radio", { name: "Personalizado" }));
    await user.click(screen.getByRole("radio", { name: "Perfil pronto" }));

    await user.click((await linhaDaTabela("Carla Mendes")).getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("radio", { name: "Perfil pronto" }));
    fireEvent.submit(screen.getByRole("button", { name: "Salvar alterações" }).closest("form"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Selecione um perfil de acesso.");

    await user.click(screen.getByRole("radio", { name: "Administrador" }));
    await user.click(screen.getByRole("radio", { name: "Usuário" }));
    expect(screen.getByRole("radio", { name: "Personalizado" })).toHaveAttribute("aria-checked", "true");
  });

  it("trata erro ao salvar e exclusão", async () => {
    responder({ method: "post", url: /^\/usuarios\/$/, status: 400, data: { email: ["Já existe."] } });
    const { user } = renderApp("/usuarios");
    await linhaDaTabela("Bruno Lima");
    await preencherBasico(user);
    await user.click(screen.getByRole("button", { name: "Convidar usuário" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("email: Já existe.");
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));

    const bruno = await linhaDaTabela("Bruno Lima");
    await user.click(bruno.getByRole("button", { name: "Editar" }));
    await user.click(bruno.getByRole("button", { name: "Excluir" }));
    await cancelarModal(user);
    await user.click(bruno.getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByText("Usuário excluído.")).toBeInTheDocument();

    responder({ method: "delete", url: /^\/usuarios\/3\/$/, status: 500, data: {} });
    await user.click((await linhaDaTabela("Carla Mendes")).getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro ao excluir usuário.");
  });

  it("mostra quem usa 2FA e permite ao admin redefinir", async () => {
    const { user } = renderApp("/usuarios");
    const bruno = await linhaDaTabela("Bruno Lima");
    expect(bruno.getByText("2FA")).toBeInTheDocument();
    expect((await linhaDaTabela("Carla Mendes")).queryByRole("button", { name: "Redefinir 2FA" })).not.toBeInTheDocument();

    await user.click(bruno.getByRole("button", { name: "Redefinir 2FA" }));
    await cancelarModal(user);
    expect(chamadasPara("post", "/usuarios/2/resetar-mfa/")).toHaveLength(0);

    await user.click(bruno.getByRole("button", { name: "Redefinir 2FA" }));
    await confirmarModal(user, "Redefinir");
    expect(await screen.findByText("Verificação em duas etapas redefinida.")).toBeInTheDocument();
    expect(chamadasPara("post", "/usuarios/2/resetar-mfa/")).toHaveLength(1);

    responder({ method: "post", url: /^\/usuarios\/2\/resetar-mfa\/$/, status: 500, data: {} });
    await user.click((await linhaDaTabela("Bruno Lima")).getByRole("button", { name: "Redefinir 2FA" }));
    await confirmarModal(user, "Redefinir");
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro ao redefinir a verificação em duas etapas.");
  });

  it("estado vazio e falha ao carregar", async () => {
    responder({ method: "get", url: /^\/usuarios\/$/, data: [] });
    const { unmount } = renderApp("/usuarios");
    expect(await screen.findByText("Nenhum usuário cadastrado")).toBeInTheDocument();
    unmount();

    responder({ method: "get", url: /^\/usuarios\/$/, status: 500, data: {} });
    renderApp("/usuarios");
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os usuários.");
  });
});

describe("Perfis de acesso", () => {
  it("cria perfil com permissões", async () => {
    const { user } = renderApp("/perfis");
    await linhaDaTabela("Analista");
    expect(screen.getByText("Sem descrição")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome"), "Operador");
    await user.type(screen.getByLabelText("Descrição"), "Opera");
    await user.click(screen.getByRole("checkbox", { name: "Ver painéis" }));
    await user.click(screen.getByRole("button", { name: "Criar perfil" }));
    expect(await screen.findByText("Perfil criado.")).toBeInTheDocument();
    expect(chamadasPara("post", "/perfis/")[0].body).toEqual({ nome: "Operador", descricao: "Opera", permissoes: ["ver_paineis"] });
  });

  it("edita, cancela e trata erro", async () => {
    const { user } = renderApp("/perfis");
    const padrao = await linhaDaTabela("Visualizador");
    expect(padrao.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
    await user.click(padrao.getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Perfil atualizado.")).toBeInTheDocument();

    responder({ method: "put", url: /^\/perfis\/3\/$/, status: 400, data: { nome: ["Duplicado."] } });
    await user.click((await linhaDaTabela("Analista")).getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("nome: Duplicado.");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Novo perfil" })).toBeInTheDocument();
  });

  it("exclui perfil customizado e trata falha", async () => {
    const { user } = renderApp("/perfis");
    const analista = await linhaDaTabela("Analista");
    await user.click(analista.getByRole("button", { name: "Editar" }));
    await user.click(analista.getByRole("button", { name: "Excluir" }));
    await cancelarModal(user);
    await user.click(analista.getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByText("Perfil excluído.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));

    responder({ method: "delete", url: /^\/perfis\/3\/$/, status: 400, data: { detail: "Perfil em uso." } });
    await user.click((await linhaDaTabela("Analista")).getByRole("button", { name: "Excluir" }));
    await confirmarModal(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Perfil em uso.");
  });

  it("estado vazio e falha ao carregar", async () => {
    responder({ method: "get", url: /^\/perfis\/$/, data: [] });
    const { unmount } = renderApp("/perfis");
    expect(await screen.findByText("Nenhum perfil cadastrado")).toBeInTheDocument();
    unmount();

    responder({ method: "get", url: /^\/perfis\/$/, status: 500, data: {} });
    renderApp("/perfis");
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os perfis.");
  });
});
