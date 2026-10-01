import axios, { AxiosError } from "axios";
import { api } from "../services/api";
import {
  catalogoPermissoes,
  conexoes,
  consultasApi,
  consultasSql,
  execucaoPainel,
  historico,
  itensPainel,
  paineis,
  perfis,
  usuarioAdmin,
  usuarios,
} from "./dados";

const ROTAS_PADRAO = [
  { method: "get", url: /^\/paineis\/\d+\/executar\/$/, data: execucaoPainel },
  { method: "get", url: /^\/paineis\/\d+\/$/, data: paineis[0] },
  { method: "get", url: /^\/paineis\/$/, data: paineis },
  { method: "post", url: /^\/paineis\/$/, data: { id: 99 } },
  { method: "get", url: /^\/painel-itens\//, data: itensPainel },
  { method: "get", url: /^\/conexoes\/$/, data: conexoes },
  { method: "post", url: /^\/conexoes\/\d+\/testar\/$/, data: { detail: "Conexão estabelecida." } },
  { method: "get", url: /^\/consultas-sql\/$/, data: consultasSql },
  { method: "post", url: /^\/consultas-sql\/\d+\/executar\/$/, data: { linhas: [{ total: 12 }], total_linhas: 1 } },
  { method: "get", url: /^\/consultas-api\/$/, data: consultasApi },
  {
    method: "post",
    url: /^\/consultas-api\/\d+\/testar\/$/,
    data: { sucesso: true, status_code: 200, duracao_ms: 87, body_preview: "{\"ok\":true}" },
  },
  { method: "get", url: /^\/usuarios\/$/, data: usuarios },
  { method: "post", url: /^\/usuarios\/\d+\/resetar-mfa\/$/, data: { detail: "Verificação em duas etapas redefinida." } },
  { method: "get", url: /^\/auth\/mfa\/$/, data: { ativo: false, codigos_backup_restantes: 0 } },
  { method: "get", url: /^\/perfis\/$/, data: perfis },
  { method: "get", url: /^\/permissoes-tela\/$/, data: catalogoPermissoes },
  { method: "get", url: /^\/historico\/resumo\/$/, data: { total_registros: 120, total_alertas: 12, total_erros: 3 } },
  { method: "get", url: /^\/historico\/$/, data: historico },
  { method: "post", url: /^\/demo\/carregar\/$/, data: { detail: "Dados de demonstração carregados.", painel_id: 1 } },
  {
    method: "post",
    url: /^\/auth\/(login|registrar)\/$/,
    data: { access: "token-acesso", refresh: "token-refresh", usuario: usuarioAdmin },
  },
];

let rotasExtras = [];
export const chamadas = [];

/**
 * Registra respostas específicas para o teste atual (têm prioridade sobre as padrão).
 * Cada rota: { method, url: RegExp, status?, data }.
 */
export function responder(...rotas) {
  rotasExtras = [...rotas, ...rotasExtras];
}

export function chamadasPara(method, url) {
  return chamadas.filter((c) => c.method === method && (url instanceof RegExp ? url.test(c.url) : c.url === url));
}

function lerCorpo(data) {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

async function adaptadorFalso(config) {
  const method = (config.method || "get").toLowerCase();
  const url = config.url;
  const body = lerCorpo(config.data);
  chamadas.push({ method, url, body, params: config.params });

  const rota = [...rotasExtras, ...ROTAS_PADRAO].find((r) => r.method === method && r.url.test(url));
  const status = rota?.status ?? 200;
  const data = typeof rota?.data === "function" ? rota.data({ url, body, params: config.params }) : rota?.data ?? {};
  const response = { data, status, statusText: String(status), headers: {}, config };

  if (status >= 400) {
    throw new AxiosError(`Request failed with status code ${status}`, "ERR_BAD_REQUEST", config, null, response);
  }
  return response;
}

export function instalarApiFalsa() {
  rotasExtras = [];
  chamadas.length = 0;
  api.defaults.adapter = adaptadorFalso;
  axios.defaults.adapter = adaptadorFalso;
}
