import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialogProvider, useConfirm } from "./ConfirmDialogContext";

function Disparador({ opcoes }) {
  const confirm = useConfirm();
  const [resultado, setResultado] = useState("nenhum");
  return (
    <>
      <button type="button" onClick={async () => setResultado(String(await confirm(opcoes)))}>Abrir</button>
      <span data-testid="resultado">{resultado}</span>
    </>
  );
}

function renderizar(opcoes) {
  const user = userEvent.setup();
  render(
    <ConfirmDialogProvider>
      <Disparador opcoes={opcoes} />
    </ConfirmDialogProvider>,
  );
  return user;
}

describe("ConfirmDialog", () => {
  it("usa textos padrão, foca o cancelar e resolve true ao confirmar", async () => {
    const user = renderizar();
    await user.click(screen.getByRole("button", { name: "Abrir" }));
    expect(screen.getByRole("alertdialog", { name: "Confirmar ação" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus());
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(screen.getByTestId("resultado")).toHaveTextContent("true");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("fecha com Escape e pelo fundo", async () => {
    const user = renderizar({ title: "Sair", variant: "primary", confirmLabel: "Sim" });
    await user.click(screen.getByRole("button", { name: "Abrir" }));
    expect(screen.getByRole("button", { name: "Sim" })).toHaveClass("btn-primary");
    await user.keyboard("{Escape}");
    expect(screen.getByTestId("resultado")).toHaveTextContent("false");

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await user.click(screen.getByRole("button", { name: "Fechar confirmação" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("mantém o foco preso dentro do diálogo", async () => {
    const user = renderizar();
    await user.click(screen.getByRole("button", { name: "Abrir" }));
    const cancelar = screen.getByRole("button", { name: "Cancelar" });
    const confirmar = screen.getByRole("button", { name: "Confirmar" });
    await waitFor(() => expect(cancelar).toHaveFocus());

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(confirmar).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(cancelar).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(confirmar).toHaveFocus();
    await user.keyboard("{a}");
    expect(confirmar).toHaveFocus();
  });

  it("exige o provider", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Disparador />)).toThrow("useConfirm deve ser usado dentro de ConfirmDialogProvider.");
    erro.mockRestore();
  });
});
