import { describe, expect, it } from "vitest";
import { api } from "./api";
import {
  getAccessToken,
  getAuthUser,
  getRefreshToken,
  hasPermissao,
  saveAccessToken,
  saveAuth,
  updateAuthUser,
} from "./authStorage";
import { chamadas, responder } from "../test/apiFalsa";

describe("authStorage", () => {
  it("salva e atualiza os dados do usuário", () => {
    saveAuth({ access: "a", refresh: "r", usuario: { nome: "Ana", permissoes: ["ver_paineis"] } });
    saveAccessToken("b");
    saveAccessToken("");
    updateAuthUser({ email: "ana@acme.com" });
    updateAuthUser(null);
    expect(getAccessToken()).toBe("b");
    expect(getAuthUser()).toEqual({ nome: "Ana", permissoes: ["ver_paineis"], email: "ana@acme.com" });
    expect(hasPermissao("ver_paineis")).toBe(true);
    expect(hasPermissao("gerenciar_usuarios")).toBe(false);
  });

  it("tolera usuário corrompido ou ausente", () => {
    sessionStorage.setItem("authUser", "{quebrado");
    expect(getAuthUser()).toBeNull();
    expect(hasPermissao("ver_paineis")).toBe(false);
    sessionStorage.clear();
    updateAuthUser({ nome: "Novo" });
    expect(getAuthUser()).toEqual({ nome: "Novo" });
  });
});

describe("api", () => {
  it("envia o token de acesso", async () => {
    saveAuth({ access: "tok", refresh: "ref" });
    await api.get("/paineis/");
    expect(chamadas.at(-1).url).toBe("/paineis/");
  });

  it("renova o token quando recebe 401 e repete a requisição", async () => {
    saveAuth({ access: "velho", refresh: "ref" });
    let tentativas = 0;
    responder(
      { method: "post", url: /\/auth\/refresh\/$/, data: { access: "novo" } },
      {
        method: "get",
        url: /^\/conexoes\/$/,
        get status() {
          tentativas += 1;
          return tentativas === 1 ? 401 : 200;
        },
        data: [{ id: 1 }],
      },
    );

    const res = await api.get("/conexoes/");
    expect(res.data).toEqual([{ id: 1 }]);
    expect(getAccessToken()).toBe("novo");
    expect(chamadas.filter((c) => c.url.endsWith("/auth/refresh/"))).toHaveLength(1);
  });

  it("limpa a sessão quando a renovação falha", async () => {
    saveAuth({ access: "velho", refresh: "ref" });
    responder(
      { method: "get", url: /^\/conexoes\/$/, status: 401, data: {} },
      { method: "post", url: /\/auth\/refresh\/$/, status: 401, data: {} },
    );
    await expect(api.get("/conexoes/")).rejects.toBeTruthy();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("rejeita resposta de renovação sem token", async () => {
    saveAuth({ access: "velho", refresh: "ref" });
    responder(
      { method: "get", url: /^\/conexoes\/$/, status: 401, data: {} },
      { method: "post", url: /\/auth\/refresh\/$/, data: {} },
    );
    await expect(api.get("/conexoes/")).rejects.toThrow("Resposta de refresh inválida.");
  });

  it("não tenta renovar sem refresh token nem em rotas de autenticação", async () => {
    saveAuth({ access: "velho" });
    responder({ method: "get", url: /^\/conexoes\/$/, status: 401, data: {} });
    await expect(api.get("/conexoes/")).rejects.toMatchObject({ response: { status: 401 } });

    saveAuth({ refresh: "ref" });
    responder({ method: "post", url: /^\/auth\/login\/$/, status: 401, data: {} });
    await expect(api.post("/auth/login/", {})).rejects.toMatchObject({ response: { status: 401 } });
    expect(chamadas.some((c) => c.url.endsWith("/auth/refresh/"))).toBe(false);
  });
});
