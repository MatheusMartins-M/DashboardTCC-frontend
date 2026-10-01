import { useEffect, useState } from "react";
import { CircleCheck, CircleX, Globe, Pencil, Plus, Send, Timer, Trash2, X, Zap } from "lucide-react";
import { useConfirm } from "../context/ConfirmDialogContext";
import {
  Alert,
  Badge,
  CountPill,
  EmptyState,
  IconButton,
  LoadingState,
  PageHeader,
  StatusBadge,
  Surface,
  SwitchField,
  SubmitButton,
} from "../components/ui";
import { api } from "../services/api";
import { formatarErroApi } from "../utils/format";
import "../styles/Admin.css";

const METODOS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];

const TOM_METODO = {
  GET: "success",
  POST: "primary",
  PUT: "warning",
  PATCH: "warning",
  DELETE: "danger",
  HEAD: "neutral",
};

const FORM_VAZIO = {
  nome: "",
  descricao: "",
  url: "",
  metodo: "GET",
  headers: "{}",
  body: "",
  timeout_ms: 10000,
  status_esperado: 200,
  intervalo_segundos: 300,
  ativo: true,
};

export function ConsultasApi() {
  const confirm = useConfirm();
  const [itens, setItens] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [testandoId, setTestandoId] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregar() {
    setLoading(true);
    try {
      const res = await api.get("/consultas-api/");
      setItens(res.data);
    } catch {
      setErro("Não foi possível carregar as consultas API.");
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
      descricao: item.descricao || "",
      url: item.url,
      metodo: item.metodo,
      headers: JSON.stringify(item.headers || {}, null, 2),
      body: item.body || "",
      timeout_ms: item.timeout_ms,
      status_esperado: item.status_esperado,
      intervalo_segundos: item.intervalo_segundos,
      ativo: item.ativo,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setMensagem("");

    let headers;
    try {
      headers = JSON.parse(form.headers || "{}");
    } catch {
      setErro("Headers devem ser um JSON válido.");
      setSalvando(false);
      return;
    }

    const payload = {
      ...form,
      headers,
      timeout_ms: Number(form.timeout_ms),
      status_esperado: Number(form.status_esperado),
      intervalo_segundos: Number(form.intervalo_segundos),
    };

    try {
      if (editId) {
        await api.put(`/consultas-api/${editId}/`, payload);
        setMensagem("Consulta API atualizada.");
      } else {
        await api.post("/consultas-api/", payload);
        setMensagem("Consulta API criada.");
      }
      resetForm();
      await carregar();
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao salvar consulta API."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    const confirmado = await confirm({
      title: "Excluir consulta API",
      message: "Deseja excluir esta consulta? Itens de painel que a utilizam podem parar de funcionar.",
      confirmLabel: "Excluir",
    });
    if (!confirmado) return;
    try {
      await api.delete(`/consultas-api/${id}/`);
      if (editId === id) resetForm();
      await carregar();
      setMensagem("Consulta API excluída.");
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao excluir consulta API."));
    }
  }

  async function testar(item) {
    setTestandoId(item.id);
    setResultado(null);
    setErro("");
    try {
      const res = await api.post(`/consultas-api/${item.id}/testar/`);
      setResultado({ ...res.data, nome: item.nome });
    } catch (e) {
      setErro(e.response?.data?.detail || "Erro ao testar API.");
    } finally {
      setTestandoId(null);
    }
  }

  return (
    <div className="page">
      <PageHeader
        icon={Globe}
        title="Consultas API"
        subtitle="Cadastre endpoints HTTP e defina o status esperado para monitorar a disponibilidade."
      />

      {mensagem && <Alert variant="success" onClose={() => setMensagem("")}>{mensagem}</Alert>}
      {erro && <Alert variant="danger" onClose={() => setErro("")}>{erro}</Alert>}

      <div className="row g-4">
        <div className="col-lg-5">
          <Surface
            sticky
            editing={Boolean(editId)}
            icon={editId ? Pencil : Plus}
            title={editId ? "Editar consulta API" : "Nova consulta API"}
            subtitle={editId ? form.nome : "Configure a requisição a ser monitorada"}
          >
            <form onSubmit={salvar} className="form-grid">
              <div>
                <label className="form-label" htmlFor="consulta-api-nome">Nome</label>
                <input id="consulta-api-nome" className="form-control" placeholder="Ex.: API de pagamentos" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div>
                <label className="form-label" htmlFor="consulta-api-url">Requisição</label>
                <div className="api-request-row">
                  <select id="consulta-api-metodo" className="form-select api-method-select" aria-label="Método HTTP" value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
                    {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input id="consulta-api-url" className="form-control font-monospace" type="url" placeholder="https://api.exemplo.com/health" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="consulta-api-headers">Headers (JSON)</label>
                <textarea id="consulta-api-headers" className="form-control font-monospace" rows={3} spellCheck={false} value={form.headers} onChange={(e) => setForm({ ...form, headers: e.target.value })} />
              </div>
              <div>
                <label className="form-label" htmlFor="consulta-api-body">Body</label>
                <textarea id="consulta-api-body" className="form-control font-monospace" rows={4} spellCheck={false} placeholder="Opcional — usado em POST, PUT, PATCH e DELETE" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              </div>
              <div className="form-grid-3">
                <div>
                  <label className="form-label" htmlFor="consulta-api-timeout">Timeout (ms)</label>
                  <input id="consulta-api-timeout" type="number" className="form-control" value={form.timeout_ms} onChange={(e) => setForm({ ...form, timeout_ms: e.target.value })} />
                </div>
                <div>
                  <label className="form-label" htmlFor="consulta-api-status">Status esperado</label>
                  <input id="consulta-api-status" type="number" className="form-control" value={form.status_esperado} onChange={(e) => setForm({ ...form, status_esperado: e.target.value })} />
                </div>
                <div>
                  <label className="form-label" htmlFor="consulta-api-intervalo">Intervalo (s)</label>
                  <input id="consulta-api-intervalo" type="number" min={30} className="form-control" value={form.intervalo_segundos} onChange={(e) => setForm({ ...form, intervalo_segundos: e.target.value })} />
                </div>
              </div>
              <SwitchField
                id="ativo-api"
                label="Consulta ativa"
                description="Consultas inativas não são executadas nos painéis."
                checked={form.ativo}
                onChange={(ativo) => setForm({ ...form, ativo })}
              />
              <div className="form-actions">
                <SubmitButton salvando={salvando} editando={Boolean(editId)} label="Criar consulta" />
                {editId && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>}
              </div>
            </form>
          </Surface>
        </div>

        <div className="col-lg-7">
          <Surface
            flush
            icon={Globe}
            title="Consultas cadastradas"
            subtitle="Teste o endpoint para conferir status e tempo de resposta"
            actions={<CountPill>{itens.length}</CountPill>}
          >
            {loading && <LoadingState label="Carregando consultas..." />}
            {!loading && !itens.length && (
              <EmptyState icon={Globe} title="Nenhuma consulta API cadastrada" description="Cadastre um endpoint ao lado para monitorar sua disponibilidade." />
            )}
            {!loading && itens.length > 0 && (
              <div className="table-scroll">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="col-grow">Endpoint</th>
                      <th>Esperado</th>
                      <th>Status</th>
                      <th className="col-actions">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item) => (
                      <tr key={item.id} className={editId === item.id ? "is-editing" : ""}>
                        <td className="col-grow">
                          <div className="cell-main">
                            <Badge tone={TOM_METODO[item.metodo] || "neutral"} mono>{item.metodo}</Badge>
                            <div className="min-w-0">
                              <div className="cell-title">{item.nome}</div>
                              <div className="cell-sub cell-mono cell-truncate" title={item.url}>{item.url}</div>
                            </div>
                          </div>
                        </td>
                        <td><Badge tone="neutral" mono>HTTP {item.status_esperado}</Badge></td>
                        <td><StatusBadge ativo={item.ativo} ativoLabel="Ativa" inativoLabel="Inativa" /></td>
                        <td className="col-actions">
                          <div className="row-actions">
                            <IconButton icon={Send} label="Testar endpoint" tone="success" onClick={() => testar(item)} loading={testandoId === item.id} />
                            <IconButton icon={Pencil} label="Editar" tone="primary" onClick={() => editar(item)} />
                            <IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => excluir(item.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>

          {resultado && (
            <Surface
              className="fade-up"
              icon={Zap}
              title={`Teste: ${resultado.nome}`}
              subtitle={resultado.sucesso ? "O endpoint respondeu com o status esperado" : "O status retornado difere do esperado"}
              actions={<IconButton icon={X} label="Fechar resultado" onClick={() => setResultado(null)} />}
            >
              <div className="api-result-summary">
                <div className={`api-result-status ${resultado.sucesso ? "is-ok" : "is-fail"}`}>
                  {resultado.sucesso ? <CircleCheck size={20} /> : <CircleX size={20} />}
                  <div>
                    <strong>{resultado.sucesso ? "Sucesso" : "Falha"}</strong>
                    <span>HTTP {resultado.status_code} · esperado {resultado.status_esperado}</span>
                  </div>
                </div>
                {resultado.duracao_ms != null && (
                  <span className="chip"><Timer size={12} />{resultado.duracao_ms} ms</span>
                )}
              </div>
              {resultado.body_preview && (
                <>
                  <div className="form-section-title mt-3 mb-2">Prévia da resposta</div>
                  <pre className="code-block">{resultado.body_preview}</pre>
                </>
              )}
            </Surface>
          )}
        </div>
      </div>
    </div>
  );
}
