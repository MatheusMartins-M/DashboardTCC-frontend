export function formatarValorItem(item) {
  if (item.erro) return "Erro";
  if (item.tipo === "api") {
    return item.dados?.sucesso ? "OK" : "Falha";
  }
  if (item.formato === "tabela") {
    return item.dados?.total_linhas ?? "-";
  }
  return item.valor ?? item.dados?.valor ?? "-";
}

export function resolverCriticidadeItem(item) {
  if (item.criticidade) return item.criticidade;
  if (item.erro) {
    return { nivel: "erro", rotulo: "Erro", cor: "#810600" };
  }
  const cor = item.cor || "#64748b";
  if (cor.toLowerCase() === "#039c08") {
    return { nivel: "normal", rotulo: "Normal", cor };
  }
  if (cor.toLowerCase() === "#d19d0d") {
    return { nivel: "atencao", rotulo: "Atenção", cor };
  }
  if (cor.toLowerCase() === "#810600") {
    return { nivel: "critico", rotulo: "Crítico", cor };
  }
  return { nivel: "neutro", rotulo: "Indefinido", cor };
}

export function resumirCriticidade(itens = []) {
  return itens.reduce(
    (acc, item) => {
      const nivel = resolverCriticidadeItem(item).nivel || "neutro";
      acc[nivel] = (acc[nivel] || 0) + 1;
      return acc;
    },
    { normal: 0, atencao: 0, critico: 0, erro: 0, neutro: 0 },
  );
}

export const PERMISSAO_LABEL = {
  ADMIN: "Administrador",
  USER: "Usuário",
};
