export const PERMISSOES_TELA = {
  ver_paineis: "Visualizar painéis",
  gerenciar_paineis: "Gerenciar painéis",
  ver_historico: "Visualizar histórico",
  ver_rotacao: "Rotação de painéis",
  gerenciar_conexoes: "Gerenciar conexões",
  gerenciar_consultas_sql: "Gerenciar consultas SQL",
  gerenciar_consultas_api: "Gerenciar consultas API",
  gerenciar_usuarios: "Gerenciar usuários",
};

export const PERMISSOES_PADRAO_USUARIO = [
  "ver_paineis",
  "ver_historico",
  "ver_rotacao",
];

export const ROTAS_POR_PERMISSAO = {
  ver_paineis: ["/paineis/:id", "/home"],
  gerenciar_paineis: ["/paineis", "/paineis/:id/editar"],
  ver_historico: ["/historico"],
  ver_rotacao: ["/rotacao"],
  gerenciar_conexoes: ["/conexoes"],
  gerenciar_consultas_sql: ["/consultas-sql"],
  gerenciar_consultas_api: ["/consultas-api"],
  gerenciar_usuarios: ["/usuarios", "/perfis"],
};
