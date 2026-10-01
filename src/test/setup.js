import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { instalarApiFalsa } from "./apiFalsa";

globalThis.__APP_BUILD_ID__ = "test";

class ArmazenamentoMemoria {
  #dados = new Map();
  get length() { return this.#dados.size; }
  key(indice) { return [...this.#dados.keys()][indice] ?? null; }
  getItem(chave) { return this.#dados.has(chave) ? this.#dados.get(chave) : null; }
  setItem(chave, valor) { this.#dados.set(chave, String(valor)); }
  removeItem(chave) { this.#dados.delete(chave); }
  clear() { this.#dados.clear(); }
}

for (const nome of ["localStorage", "sessionStorage"]) {
  const armazenamento = new ArmazenamentoMemoria();
  Object.defineProperty(globalThis, nome, { value: armazenamento, configurable: true });
  Object.defineProperty(window, nome, { value: armazenamento, configurable: true });
}

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  instalarApiFalsa();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
