import { describe, expect, it } from "vitest";
import { formatarErroApi, gradientePorTexto, iniciais } from "./format";
import { formatarValorItem, resolverCriticidadeItem, resumirCriticidade } from "./painelDisplay";

describe("iniciais", () => {
  it("usa primeira e última palavra do nome", () => {
    expect(iniciais("Ana Maria Souza")).toBe("AS");
  });

  it("usa as duas primeiras letras quando há só uma palavra", () => {
    expect(iniciais("bruno")).toBe("BR");
  });

  it("retorna ? para nome vazio", () => {
    expect(iniciais("")).toBe("?");
    expect(iniciais(null)).toBe("?");
  });
});

describe("gradientePorTexto", () => {
  it("é determinístico para o mesmo texto", () => {
    expect(gradientePorTexto("Financeiro")).toBe(gradientePorTexto("Financeiro"));
  });

  it("sempre retorna um gradiente", () => {
    expect(gradientePorTexto(undefined)).toMatch(/^linear-gradient/);
    expect(gradientePorTexto("Operação logística")).toMatch(/^linear-gradient/);
  });
});

describe("formatarErroApi", () => {
  it("achata erros de campo do DRF", () => {
    const erro = { response: { data: { nome: ["Obrigatório."], email: "Inválido." } } };
    expect(formatarErroApi(erro)).toBe("nome: Obrigatório. · email: Inválido.");
  });

  it("não prefixa detail e non_field_errors", () => {
    const erro = { response: { data: { detail: "Sem permissão.", non_field_errors: ["Duplicado."] } } };
    expect(formatarErroApi(erro)).toBe("Sem permissão. · Duplicado.");
  });

  it("converte valores não textuais", () => {
    expect(formatarErroApi({ response: { data: { codigo: [42] } } })).toBe("42");
  });

  it("usa a mensagem do erro quando não há resposta", () => {
    expect(formatarErroApi(new Error("Network Error"))).toBe("Network Error");
  });

  it("usa o fallback quando não há nada aproveitável", () => {
    expect(formatarErroApi({}, "Falhou.")).toBe("Falhou.");
    expect(formatarErroApi({ response: { data: {} } }, "Falhou.")).toBe("Falhou.");
  });
});

describe("painelDisplay", () => {
  it("formata o valor conforme tipo e formato", () => {
    expect(formatarValorItem({ erro: "x" })).toBe("Erro");
    expect(formatarValorItem({ tipo: "api", dados: { sucesso: true } })).toBe("OK");
    expect(formatarValorItem({ tipo: "api", dados: { sucesso: false } })).toBe("Falha");
    expect(formatarValorItem({ formato: "tabela", dados: { total_linhas: 3 } })).toBe(3);
    expect(formatarValorItem({ formato: "tabela" })).toBe("-");
    expect(formatarValorItem({ valor: 7 })).toBe(7);
    expect(formatarValorItem({ dados: { valor: 9 } })).toBe(9);
    expect(formatarValorItem({})).toBe("-");
  });

  it("resolve a criticidade pela cor quando não vem do backend", () => {
    expect(resolverCriticidadeItem({ criticidade: { nivel: "x" } }).nivel).toBe("x");
    expect(resolverCriticidadeItem({ erro: "falhou" }).nivel).toBe("erro");
    expect(resolverCriticidadeItem({ cor: "#039C08" }).nivel).toBe("normal");
    expect(resolverCriticidadeItem({ cor: "#D19D0D" }).nivel).toBe("atencao");
    expect(resolverCriticidadeItem({ cor: "#810600" }).nivel).toBe("critico");
    expect(resolverCriticidadeItem({}).nivel).toBe("neutro");
  });

  it("conta os itens por nível", () => {
    const resumo = resumirCriticidade([{ cor: "#039C08" }, { cor: "#810600" }, { erro: "x" }, {}]);
    expect(resumo).toEqual({ normal: 1, atencao: 0, critico: 1, erro: 1, neutro: 1 });
    expect(resumirCriticidade()).toEqual({ normal: 0, atencao: 0, critico: 0, erro: 0, neutro: 0 });
  });
});
