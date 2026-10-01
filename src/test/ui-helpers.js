import { screen, within } from "@testing-library/react";

export async function linhaDaTabela(texto) {
  const celula = await screen.findByText(texto, { selector: ".cell-title" });
  return within(celula.closest("tr"));
}

export async function confirmarModal(user, rotulo = "Excluir") {
  const dialogo = await screen.findByRole("alertdialog");
  await user.click(within(dialogo).getByRole("button", { name: rotulo }));
}

export async function cancelarModal(user) {
  const dialogo = await screen.findByRole("alertdialog");
  await user.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
}
