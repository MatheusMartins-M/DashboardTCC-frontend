import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getAccessToken, getAuthUser } from "../services/authStorage";
import { chamadasPara, responder } from "../test/apiFalsa";
import { usuarioAdmin } from "../test/dados";
import { renderApp } from "../test/renderApp";

describe("Login", () => {
  it("autentica e vai para a home", async () => {
    const { user } = renderApp("/login", { autenticado: false });
    await user.type(screen.getByLabelText("E-mail"), "ana@acme.com");
    await user.type(screen.getByLabelText("Senha"), "segredo1");
    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
    await user.click(screen.getByRole("button", { name: /Entrar/ }));

    expect(await screen.findByRole("heading", { level: 1, name: /Ana/ })).toBeInTheDocument();
    expect(chamadasPara("post", "/auth/login/")[0].body).toEqual({ email: "ana@acme.com", senha: "segredo1" });
    expect(getAccessToken()).toBe("token-acesso");
  });

  it("mostra a mensagem de erro da API", async () => {
    responder({ method: "post", url: /^\/auth\/login\/$/, status: 401, data: { detail: "Credenciais inválidas." } });
    const { user } = renderApp("/login", { autenticado: false });
    await user.type(screen.getByLabelText("E-mail"), "ana@acme.com");
    await user.type(screen.getByLabelText("Senha"), "errada");
    await user.click(screen.getByRole("button", { name: /Entrar/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciais inválidas.");
  });

  it("rejeita resposta sem tokens", async () => {
    responder({ method: "post", url: /^\/auth\/login\/$/, data: {} });
    const { user } = renderApp("/login", { autenticado: false });
    await user.type(screen.getByLabelText("E-mail"), "ana@acme.com");
    await user.type(screen.getByLabelText("Senha"), "segredo1");
    await user.click(screen.getByRole("button", { name: /Entrar/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Resposta de autenticação inválida.");
  });

  it("redireciona quem já está autenticado", async () => {
    renderApp("/login");
    expect(await screen.findByRole("heading", { level: 1, name: /Ana/ })).toBeInTheDocument();
  });
});

describe("Login com verificação em duas etapas", () => {
  const desafio = { method: "post", url: /^\/auth\/login\/$/, data: { mfa_requerido: true, mfa_token: "desafio" } };

  async function entrarComSenha(user) {
    await user.type(screen.getByLabelText("E-mail"), "ana@acme.com");
    await user.type(screen.getByLabelText("Senha"), "segredo1");
    await user.click(screen.getByRole("button", { name: /Entrar/ }));
    await screen.findByRole("heading", { name: "Verificação em duas etapas" });
  }

  it("pede o código, mostra erro e aceita código de recuperação", async () => {
    responder(desafio, {
      method: "post",
      url: /^\/auth\/mfa\/verificar\/$/,
      status: 401,
      data: { detail: "Código inválido.", reiniciar_login: false },
    });
    const { user } = renderApp("/login", { autenticado: false });
    await entrarComSenha(user);
    expect(getAccessToken()).toBeNull();

    const campo = screen.getByLabelText("Código de verificação");
    await user.type(campo, "12ab3456");
    expect(campo).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: /Verificar/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Código inválido.");
    expect(screen.getByLabelText("Código de verificação")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Usar um código de recuperação" }));
    responder({
      method: "post",
      url: /^\/auth\/mfa\/verificar\/$/,
      data: { access: "token-acesso", refresh: "token-refresh", usuario: { ...usuarioAdmin, mfa_ativo: true } },
    });
    await user.type(screen.getByLabelText("Código de recuperação"), "abcde-fghij");
    await user.click(screen.getByRole("button", { name: /Verificar/ }));

    expect(await screen.findByRole("heading", { level: 1, name: /Ana/ })).toBeInTheDocument();
    expect(chamadasPara("post", "/auth/mfa/verificar/").at(-1).body).toEqual({ mfa_token: "desafio", codigo: "abcde-fghij" });
    expect(getAccessToken()).toBe("token-acesso");
  });

  it("volta para a senha quando o desafio expira ou a pessoa desiste", async () => {
    responder(desafio, {
      method: "post",
      url: /^\/auth\/mfa\/verificar\/$/,
      status: 401,
      data: { detail: "A verificação expirou. Faça login novamente.", reiniciar_login: true },
    });
    const { user } = renderApp("/login", { autenticado: false });
    await entrarComSenha(user);

    await user.click(screen.getByRole("button", { name: "Usar um código de recuperação" }));
    await user.click(screen.getByRole("button", { name: "Usar o app autenticador" }));
    await user.type(screen.getByLabelText("Código de verificação"), "123456");
    await user.click(screen.getByRole("button", { name: /Verificar/ }));
    expect(await screen.findByRole("heading", { name: "Bem-vindo de volta" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("A verificação expirou.");

    await user.click(screen.getByRole("button", { name: /Entrar/ }));
    await screen.findByRole("heading", { name: "Verificação em duas etapas" });
    await user.click(screen.getByRole("button", { name: "Voltar ao login" }));
    expect(screen.getByRole("heading", { name: "Bem-vindo de volta" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Cadastro", () => {
  async function preencher(user) {
    await user.type(screen.getByLabelText("Nome da organização"), "Acme");
    await user.type(screen.getByLabelText("Identificador (slug)"), "acme");
    await user.type(screen.getByLabelText("Seu nome"), "Ana Souza");
    await user.type(screen.getByLabelText("E-mail"), "ana@acme.com");
    await user.type(screen.getByLabelText("Senha"), "segredo1");
  }

  it("cria a organização e entra", async () => {
    const { user } = renderApp("/cadastro", { autenticado: false });
    await preencher(user);
    await user.click(screen.getByRole("button", { name: /Criar conta/ }));
    expect(await screen.findByRole("heading", { level: 1, name: /Ana/ })).toBeInTheDocument();
    expect(chamadasPara("post", "/auth/registrar/")[0].body).toMatchObject({ organizacao_slug: "acme", nome: "Ana Souza" });
    expect(getAuthUser().nome).toBe("Ana Souza");
  });

  it("mostra erros de validação formatados", async () => {
    responder({ method: "post", url: /^\/auth\/registrar\/$/, status: 400, data: { email: ["Já cadastrado."] } });
    const { user } = renderApp("/cadastro", { autenticado: false });
    await preencher(user);
    await user.click(screen.getByRole("button", { name: /Criar conta/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("email: Já cadastrado.");
  });

  it("rejeita resposta sem tokens", async () => {
    responder({ method: "post", url: /^\/auth\/registrar\/$/, data: {} });
    const { user } = renderApp("/cadastro", { autenticado: false });
    await preencher(user);
    await user.click(screen.getByRole("button", { name: /Criar conta/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Resposta de cadastro inválida.");
  });
});
