import { useEffect, useState } from "react";
import { Database, Pencil, Plug, Plus, Server, Trash2 } from "lucide-react";
import { useConfirm } from "../context/ConfirmDialogContext";
import {
  Alert,
  Badge,
  CountPill,
  EmptyState,
  IconButton,
  LoadingState,
  PageHeader,
  Segmented,
  StatusBadge,
  Surface,
  SwitchField,
  SubmitButton,
} from "../components/ui";
import { api } from "../services/api";
import { formatarErroApi } from "../utils/format";
import "../styles/Admin.css";

const TIPOS = [
  { value: "sqlserver", label: "SQL Server" },
  { value: "mysql", label: "MySQL" },
  { value: "mock", label: "Mock" },
];

const TIPO_INFO = {
  sqlserver: { label: "SQL Server", tone: "info" },
  mysql: { label: "MySQL", tone: "warning" },
  mock: { label: "Mock", tone: "violet" },
};

const PORTA_PADRAO = {
  sqlserver: 1433,
  mysql: 3306,
  mock: 0,
};

const FORM_VAZIO = {
  nome: "",
  tipo: "sqlserver",
  host: "",
  porta: 1433,
  banco: "",
  usuario: "",
  senha: "",
  ativo: true,
};

export function Conexoes() {
  const confirm = useConfirm();
  const [itens, setItens] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [testandoId, setTestandoId] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregar() {
    setLoading(true);
    try {
      const res = await api.get("/conexoes/");
      setItens(res.data);
    } catch {
      setErro("Não foi possível carregar as conexões.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function resetForm() {
    setForm(FORM_VAZIO);
    setEditId(null);
  }

  function editar(item) {
    setEditId(item.id);
    setForm({
      nome: item.nome,
      tipo: item.tipo,
      host: item.host,
      porta: item.porta,
      banco: item.banco,
      usuario: item.usuario,
      senha: "",
      ativo: item.ativo,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setMensagem("");

    const payload = { ...form, porta: Number(form.porta) };
    if (form.tipo === "mock") {
      payload.host = "local";
      payload.banco = "mock";
      payload.usuario = "mock";
      payload.porta = 0;
      delete payload.senha;
    } else if (editId && !payload.senha) {
      delete payload.senha;
    }

    try {
      if (editId) {
        await api.put(`/conexoes/${editId}/`, payload);
        setMensagem("Conexão atualizada.");
      } else {
        await api.post("/conexoes/", payload);
        setMensagem("Conexão criada.");
      }
      resetForm();
      await carregar();
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao salvar conexão."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    const confirmado = await confirm({
      title: "Excluir conexão",
      message: "Deseja excluir esta conexão? Consultas vinculadas podem deixar de funcionar.",
      confirmLabel: "Excluir",
    });
    if (!confirmado) return;
    try {
      await api.delete(`/conexoes/${id}/`);
      if (editId === id) resetForm();
      await carregar();
      setMensagem("Conexão excluída.");
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao excluir conexão."));
    }
  }

  async function testar(id) {
    setTestandoId(id);
    setMensagem("");
    setErro("");
    try {
      const res = await api.post(`/conexoes/${id}/testar/`);
      setMensagem(res.data.detail || "Conexão OK.");
    } catch (e) {
      setErro(e.response?.data?.detail || "Falha no teste de conexão.");
    } finally {
      setTestandoId(null);
    }
  }

  return (
    <div className="page">
      <PageHeader
        icon={Database}
        title="Conexões de banco"
        subtitle="Cadastre servidores SQL Server, MySQL ou use uma conexão mock para testar sem banco real."
      />

      {mensagem && <Alert variant="success" onClose={() => setMensagem("")}>{mensagem}</Alert>}
      {erro && <Alert variant="danger" onClose={() => setErro("")}>{erro}</Alert>}

      <div className="row g-4">
        <div className="col-lg-5">
          <Surface
            sticky
            editing={Boolean(editId)}
            icon={editId ? Pencil : Plus}
            title={editId ? "Editar conexão" : "Nova conexão"}
            subtitle={editId ? form.nome : "Preencha os dados de acesso ao banco"}
          >
            <form onSubmit={salvar} className="form-grid">
              <div>
                <label className="form-label" htmlFor="conexao-nome">Nome</label>
                <input id="conexao-nome" className="form-control" placeholder="Ex.: ERP Produção" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>

              <div>
                <span className="form-label d-block">Tipo</span>
                <Segmented
                  ariaLabel="Tipo de conexão"
                  value={form.tipo}
                  options={TIPOS}
                  onChange={(tipo) => setForm({ ...form, tipo, porta: PORTA_PADRAO[tipo] ?? PORTA_PADRAO.sqlserver })}
                />
              </div>

              {form.tipo === "mock" ? (
                <Alert variant="info" compact>
                  Não precisa de host, usuário nem senha. Os resultados vêm do campo <strong>Dados mockados</strong> de cada consulta SQL.
                </Alert>
              ) : (
                <>
                  <div className="form-grid-3">
                    <div className="span-2">
                      <label className="form-label" htmlFor="conexao-host">Host</label>
                      <input id="conexao-host" className="form-control" placeholder="10.0.0.12 ou servidor.local" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="conexao-porta">Porta</label>
                      <input id="conexao-porta" type="number" className="form-control" value={form.porta} onChange={(e) => setForm({ ...form, porta: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="conexao-banco">Banco</label>
                    <input id="conexao-banco" className="form-control" placeholder="Nome do database" value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} required />
                  </div>
                  <div className="form-grid-2">
                    <div>
                      <label className="form-label" htmlFor="conexao-usuario">Usuário</label>
                      <input id="conexao-usuario" className="form-control" autoComplete="off" value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} required />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="conexao-senha">Senha</label>
                      <input
                        id="conexao-senha"
                        type="password"
                        className="form-control"
                        autoComplete="new-password"
                        placeholder={editId ? "Manter atual" : ""}
                        value={form.senha}
                        onChange={(e) => setForm({ ...form, senha: e.target.value })}
                        required={!editId}
                      />
                    </div>
                  </div>
                </>
              )}

              <SwitchField
                id="ativo-conexao"
                label="Conexão ativa"
                description="Conexões inativas não são usadas pelas consultas."
                checked={form.ativo}
                onChange={(ativo) => setForm({ ...form, ativo })}
              />

              <div className="form-actions">
                <SubmitButton salvando={salvando} editando={Boolean(editId)} label="Criar conexão" />
                {editId && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>}
              </div>
            </form>
          </Surface>
        </div>

        <div className="col-lg-7">
          <Surface
            flush
            icon={Server}
            title="Conexões cadastradas"
            subtitle="Teste a conectividade antes de vincular consultas"
            actions={<CountPill>{itens.length}</CountPill>}
          >
            {loading && <LoadingState label="Carregando conexões..." />}
            {!loading && !itens.length && (
              <EmptyState icon={Database} title="Nenhuma conexão cadastrada" description="Cadastre a primeira conexão ao lado para começar a criar consultas SQL." />
            )}
            {!loading && itens.length > 0 && (
              <div className="table-scroll">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="col-grow">Conexão</th>
                      <th>Tipo</th>
                      <th>Status</th>
                      <th className="col-actions">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item) => {
                      const tipo = TIPO_INFO[item.tipo] || { label: item.tipo, tone: "neutral" };
                      return (
                        <tr key={item.id} className={editId === item.id ? "is-editing" : ""}>
                          <td className="col-grow">
                            <div className="cell-main">
                              <span className={`cell-icon cell-icon--${tipo.tone}`}><Database size={15} /></span>
                              <div className="min-w-0">
                                <div className="cell-title">{item.nome}</div>
                                <div className="cell-sub cell-mono">
                                  {item.tipo === "mock" ? "dados fictícios" : `${item.host}:${item.porta}/${item.banco}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td><Badge tone={tipo.tone}>{tipo.label}</Badge></td>
                          <td><StatusBadge ativo={item.ativo} ativoLabel="Ativa" inativoLabel="Inativa" /></td>
                          <td className="col-actions">
                            <div className="row-actions">
                              <IconButton icon={Plug} label="Testar conexão" tone="success" onClick={() => testar(item.id)} loading={testandoId === item.id} />
                              <IconButton icon={Pencil} label="Editar" tone="primary" onClick={() => editar(item)} />
                              <IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => excluir(item.id)} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>
        </div>
      </div>
    </div>
  );
}
