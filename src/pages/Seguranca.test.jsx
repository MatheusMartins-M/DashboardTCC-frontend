import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getAuthUser } from "../services/authStorage";
import { chamadasPara, responder } from "../test/apiFalsa";
import { renderApp } from "../test/renderApp";

const configuracao = {
  segredo: "JBSWY3DPEHPK3PXP",
  otpauth_uri: "otpauth://totp/Monitor:ana@acme.com?secret=JBSWY3DPEHPK3PXP",
  qr_code: "data:image/svg+xml;base64,PHN2Zy8+",
};

describe("Segurança — verificação em duas etapas", () => {
  it("ativa a verificação e mostra os códigos de recuperação", async () => {
    responder(
      { method: "post", url: /^\/auth\/mfa\/configurar\/$/, data: configuracao },
      {
        method: "post",
        url: /^\/auth\/mfa\/ativar\/$/,
        data: { ativo: true, codigos_backup_restantes: 8, codigos_backup: ["aaaaa-bbbbb", "ccccc-ddddd"] },
      },
    );
    const { user } = renderApp("/seguranca");
    expect(await screen.findByText("Desativada")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Ativar verificação/ }));
    expect(await screen.findByAltText("QR code para o app autenticador")).toHaveAttribute("src", configuracao.qr_code);
    expect(screen.getByText(configuracao.segredo)).toBeInTheDocument();

    const campo = screen.getByLabelText("Código do app autenticador");
    await user.type(campo, "12a3456");
    expect(campo).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: "Confirmar ativação" }));

    const lista = await screen.findByRole("list", { name: "Códigos de recuperação" });
    expect(lista).toHaveTextContent("aaaaa-bbbbb");
    expect(chamadasPara("post", "/auth/mfa/ativar/")[0].body).toEqual({ codigo: "123456" });
    expect(getAuthUser().mfa_ativo).toBe(true);

    await user.click(screen.getByRole("button", { name: "Copiar" }));
    expect(await navigator.clipboard.readText()).toBe("aaaaa-bbbbb\nccccc-ddddd");
    expect(screen.getByRole("button", { name: "Copiado" })).toBeInTheDocument();

    URL.createObjectURL = vi.fn(() => "blob:codigos");
    URL.revokeObjectURL = vi.fn();
    const clique = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Baixar .txt" }));
    expect(clique).toHaveBeenCalledTimes(1);
    expect(await URL.createObjectURL.mock.calls[0][0].text()).toContain("aaaaa-bbbbb\nccccc-ddddd");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:codigos");
    clique.mockRestore();

    await user.click(screen.getByRole("button", { name: "Já guardei os códigos" }));
    expect(screen.getByText("Ativada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));
    expect(screen.queryByText("Verificação em duas etapas ativada.")).not.toBeInTheDocument();
  });

  it("mostra erro de código inválido e permite cancelar a configuração", async () => {
    responder(
      { method: "post", url: /^\/auth\/mfa\/configurar\/$/, data: configuracao },
      { method: "post", url: /^\/auth\/mfa\/ativar\/$/, status: 400, data: { detail: "Código inválido." } },
    );
    const { user } = renderApp("/seguranca");
    await user.click(await screen.findByRole("button", { name: /Ativar verificação/ }));
    await user.type(await screen.findByLabelText("Código do app autenticador"), "000000");
    await user.click(screen.getByRole("button", { name: "Confirmar ativação" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Código inválido.");
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: /Ativar verificação/ })).toBeInTheDocument();
  });

  it("gera novos códigos e desativa a verificação", async () => {
    responder(
      { method: "get", url: /^\/auth\/mfa\/$/, data: { ativo: true, codigos_backup_restantes: 2 } },
      {
        method: "post",
        url: /^\/auth\/mfa\/codigos-backup\/$/,
        data: { ativo: true, codigos_backup_restantes: 8, codigos_backup: ["novo1-novo2"] },
      },
      { method: "post", url: /^\/auth\/mfa\/desativar\/$/, data: { ativo: false, codigos_backup_restantes: 0 } },
    );
    const { user } = renderApp("/seguranca");
    expect(await screen.findByText(/gere novos códigos para não ficar sem acesso/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("Código do app autenticador"), "654321");
    await user.click(screen.getByRole("button", { name: "Gerar novos códigos" }));
    expect(await screen.findByRole("list", { name: "Códigos de recuperação" })).toHaveTextContent("novo1-novo2");
    expect(screen.getByText(/Os anteriores deixaram de funcionar/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Já guardei os códigos" }));

    await user.type(screen.getByLabelText("Senha atual"), "segredo1");
    await user.type(screen.getByLabelText("Código do app ou de recuperação"), "abcde-fghij");
    await user.click(screen.getByRole("button", { name: "Desativar" }));

    expect(await screen.findByText("Verificação em duas etapas desativada.")).toBeInTheDocument();
    expect(chamadasPara("post", "/auth/mfa/desativar/")[0].body).toEqual({ senha: "segredo1", codigo: "abcde-fghij" });
    expect(getAuthUser().mfa_ativo).toBe(false);
    expect(screen.getByText("Desativada")).toBeInTheDocument();
  });

  it("avisa quando não consegue carregar o status", async () => {
    responder({ method: "get", url: /^\/auth\/mfa\/$/, status: 500, data: {} });
    renderApp("/seguranca");
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as configurações de segurança.");
  });

  it("é acessível pelo menu lateral", async () => {
    const { user } = renderApp("/home");
    await user.click(await screen.findByRole("link", { name: "Segurança" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Segurança" })).toBeInTheDocument();
  });
});
