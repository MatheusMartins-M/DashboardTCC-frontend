const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
  "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)",
  "linear-gradient(135deg, #f97316 0%, #eab308 100%)",
  "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
];

export function iniciais(nome) {
  const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes.at(-1)[0]}`.toUpperCase();
}

export function gradientePorTexto(texto) {
  const valor = String(texto || "");
  let hash = 0;
  for (let i = 0; i < valor.length; i += 1) {
    hash = (hash * 31 + valor.codePointAt(i)) % 2147483647;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function achatarErros(dados, prefixo = "") {
  if (dados == null) return [];
  if (typeof dados === "string") return [prefixo ? `${prefixo}: ${dados}` : dados];
  if (Array.isArray(dados)) return dados.flatMap((item) => achatarErros(item, prefixo));
  if (typeof dados === "object") {
    return Object.entries(dados).flatMap(([campo, valor]) => {
      const rotulo = campo === "detail" || campo === "non_field_errors" ? prefixo : campo;
      return achatarErros(valor, rotulo);
    });
  }
  return [String(dados)];
}

export function formatarErroApi(error, fallback = "Não foi possível concluir a operação.") {
  const dados = error?.response?.data;
  if (!dados) return error?.message || fallback;
  const mensagens = achatarErros(dados);
  return mensagens.length ? mensagens.join(" · ") : fallback;
}
