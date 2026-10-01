export const usuarioAdmin = {
  id: 1,
  nome: "Ana Souza",
  email: "ana@acme.com",
  tipo_permissao: "ADMIN",
  organizacao: { id: 1, nome: "Acme Logística", slug: "acme" },
  permissoes: [],
};

export const usuarioComum = {
  id: 2,
  nome: "Bruno Lima",
  email: "bruno@acme.com",
  tipo_permissao: "USER",
  organizacao: { id: 1, nome: "Acme Logística", slug: "acme" },
  permissoes: ["ver_paineis", "ver_historico"],
};

export const paineis = [
  { id: 1, nome: "Operação logística", descricao: "Pedidos e filas do CD.", total_itens: 8, intervalo_segundos: 60, ativo: true },
  { id: 2, nome: "Financeiro", descricao: "", total_itens: 5, intervalo_segundos: 120, ativo: true },
  { id: 3, nome: "Suporte N1", descricao: "Chamados abertos.", total_itens: 3, intervalo_segundos: 90, ativo: false },
];

const crit = {
  normal: { nivel: "normal", rotulo: "Normal", cor: "#039C08" },
  atencao: { nivel: "atencao", rotulo: "Atenção", cor: "#D19D0D" },
  critico: { nivel: "critico", rotulo: "Crítico", cor: "#810600" },
};

export const execucaoPainel = {
  painel_nome: "Operação logística",
  intervalo_segundos: 60,
  itens: [
    { item_id: 1, titulo: "Pedidos pendentes", tipo: "sql", formato: "numero", valor: 128, criticidade: crit.normal },
    { item_id: 2, titulo: "Fila de integração", tipo: "sql", formato: "numero", valor: 42, criticidade: crit.atencao },
    { item_id: 3, titulo: "Notas rejeitadas", tipo: "sql", formato: "numero", valor: 87, criticidade: crit.critico },
    { item_id: 4, titulo: "API de pagamentos", tipo: "api", formato: "numero", dados: { sucesso: true }, criticidade: crit.normal },
    { item_id: 5, titulo: "Estoque negativo", tipo: "sql", formato: "numero", erro: "Timeout ao conectar", criticidade: { nivel: "erro", rotulo: "Erro", cor: "#810600" } },
    {
      item_id: 6,
      titulo: "Pedidos com divergência",
      tipo: "sql",
      formato: "tabela",
      dados: { total_linhas: 2, linhas: [{ pedido: 1, cliente: "Mercado Bom" }, { pedido: 2, cliente: "Loja Centro" }] },
      criticidade: crit.atencao,
    },
    { item_id: 7, titulo: "API transportadora", tipo: "api", formato: "numero", dados: { sucesso: false }, criticidade: crit.critico },
  ],
};

export const conexoes = [
  { id: 1, nome: "ERP Produção", tipo: "sqlserver", host: "10.0.0.12", porta: 1433, banco: "erp", usuario: "monitor", ativo: true },
  { id: 2, nome: "E-commerce", tipo: "mysql", host: "db.loja.local", porta: 3306, banco: "shop", usuario: "ro", ativo: true },
  { id: 3, nome: "Demonstração", tipo: "mock", host: "", porta: null, banco: "", usuario: "", ativo: false },
];

export const consultasSql = [
  { id: 1, nome: "Pedidos pendentes", descricao: "Status PENDENTE", conexao: 1, conexao_nome: "ERP Produção", sql: "SELECT COUNT(*) AS total FROM pedidos", intervalo_segundos: 60, ativo: true },
  { id: 2, nome: "Carrinhos abandonados", descricao: "", conexao: 2, conexao_nome: "E-commerce", sql: "SELECT 1", intervalo_segundos: 600, ativo: false },
  { id: 3, nome: "Demo mock", descricao: "", conexao: 3, conexao_nome: "Demonstração", sql: "SELECT 1", dados_mock: [{ total: 5 }], intervalo_segundos: 60, ativo: true },
];

export const consultasApi = [
  { id: 1, nome: "API de pagamentos", descricao: "", url: "https://api.pagamentos.com/health", metodo: "GET", headers: {}, body: "", timeout_ms: 10000, status_esperado: 200, intervalo_segundos: 60, ativo: true },
  { id: 2, nome: "Webhook", descricao: "", url: "https://transp.example.com/ping", metodo: "POST", headers: { "X-Key": "1" }, body: "{}", timeout_ms: 5000, status_esperado: 201, intervalo_segundos: 120, ativo: false },
];

export const catalogoPermissoes = {
  grupos: [
    {
      id: 1,
      nome: "Monitoramento",
      permissoes: [
        { codename: "ver_paineis", nome: "Ver painéis" },
        { codename: "ver_rotacao", nome: "Rotação de painéis" },
        { codename: "ver_historico", nome: "Histórico e alertas" },
      ],
    },
    {
      id: 2,
      nome: "Configuração",
      permissoes: [
        { codename: "gerenciar_paineis", nome: "Gerenciar painéis" },
        { codename: "gerenciar_conexoes", nome: "Conexões" },
      ],
    },
    { id: 3, nome: "Sem telas", permissoes: [] },
  ],
};

export const perfis = [
  { id: 1, nome: "Visualizador", descricao: "Apenas visualiza painéis", permissoes: ["ver_paineis"], padrao: true },
  { id: 3, nome: "Analista", descricao: "", permissoes: ["ver_paineis", "gerenciar_conexoes"], padrao: false },
];

export const usuarios = [
  { id: 1, nome: "Ana Souza", email: "ana@acme.com", tipo_permissao: "ADMIN", ativo: true, permissoes: [] },
  { id: 2, nome: "Bruno Lima", email: "bruno@acme.com", tipo_permissao: "USER", perfil_id: 1, perfil_nome: "Visualizador", ativo: true, mfa_ativo: true, permissoes: ["ver_paineis"] },
  { id: 3, nome: "Carla Mendes", email: "carla@acme.com", tipo_permissao: "USER", perfil_id: null, personalizado: true, permissoes: ["ver_paineis", "ver_historico"], ativo: false },
  { id: 4, nome: "Diego Rocha", email: "diego@acme.com", tipo_permissao: "USER", perfil_id: null, permissoes: [], ativo: true },
];

export const itensPainel = [
  { id: 1, painel: 1, titulo: "Pedidos pendentes", tipo: "sql", formato: "numero", consulta_sql: 1, consulta_api: null, campo_valor: "total", ordem: 0, ativo: true, regras_cor: [{ ate: 10, cor: "#039C08", rotulo: "Normal" }] },
  { id: 2, painel: 1, titulo: "Pagamentos", tipo: "api", formato: "numero", consulta_sql: null, consulta_api: 1, campo_valor: "", ordem: 1, ativo: false, regras_cor: [] },
];

export const historico = [
  { id: 1, executado_em: "2026-09-28T12:00:00Z", painel_nome: "Operação logística", item_titulo: "Pedidos pendentes", valor: 128, criticidade_nivel: "normal", criticidade_rotulo: "Normal" },
  { id: 2, executado_em: "2026-09-28T11:50:00Z", painel_nome: "Financeiro", item_titulo: "Títulos vencidos", valor: 9, criticidade_nivel: "critico", criticidade_rotulo: "Crítico" },
];
