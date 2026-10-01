import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

async function importarApp() {
  vi.resetModules();
  return (await import("./App")).default;
}

describe("App", () => {
  it("limpa a sessão de um build anterior e abre o login", async () => {
    sessionStorage.setItem("appBuildId", "build-antigo");
    sessionStorage.setItem("accessToken", "velho");
    window.history.pushState({}, "", "/login");

    const App = await importarApp();
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Bem-vindo de volta" })).toBeInTheDocument();
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(sessionStorage.getItem("appBuildId")).not.toBe("build-antigo");
  });

  it("mantém a sessão quando o build é o mesmo", async () => {
    await importarApp();
    sessionStorage.setItem("accessToken", "atual");
    await importarApp();
    expect(sessionStorage.getItem("accessToken")).toBe("atual");
  });
});
