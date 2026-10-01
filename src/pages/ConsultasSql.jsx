import { useEffect, useState } from "react";
import { Database, FileCode2, Pencil, Play, Plus, TableProperties, Timer, Trash2, X } from "lucide-react";
import { useConfirm } from "../context/ConfirmDialogContext";
import {
  Alert,
  CountPill,
  DataPreviewTable,
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

const FORM_VAZIO = {
  conexao: "",
  nome: "",
  descricao: "",
  sql: "SELECT 1",
  dados_mock: '[\n  { "total": 10 }\n]',
  intervalo_segundos: 300,
  ativo: true,
};

function conexaoEhMock(conexoes, conexaoId) {
  const conexao = conexoes.find((c) => String(c.id) === String(conexaoId));
  return conexao?.tipo === "mock";
}

function dadosMockParaTexto(valor) {
  if (!valor || (Array.isArray(valor) && !valor.length)) {
    return '[\n  { "total": 10 }\n]';
  }
  return JSON.stringify(valor, null, 2);
}

function parseDadosMock(texto) {
  try {
    const parsed = JSON.parse(texto);
    if (!Array.isArray(parsed)) {
      throw new TypeError("O JSON deve ser uma lista de objetos.");
    }
    return parsed;
  } catch (err) {
    throw new Error(err.message || "JSON inválido nos dados mockados.");
  }
}

export function ConsultasSql() {
  const confirm = useConfirm();
  const [conexoes, setConexoes] = useState([]);
  const [itens, setItens] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [executandoId, setExecutandoId] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const usaMock = conexaoEhMock(conexoes, form.conexao);

  async function carregar() {
    setLoading(true);
    try {
      const [resConexoes, resConsultas] = await Promise.all([
        api.get("/conexoes/"),
        api.get("/consultas-sql/"),
      ]);
      setConexoes(resConexoes.data);
      setItens(resConsultas.data);
    } catch {
      setErro("Não foi possível carregar os dados.");
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
      conexao: item.conexao,
      nome: item.nome,
      descricao: item.descricao || "",
      sql: item.sql,
      dados_mock: dadosMockParaTexto(item.dados_mock),
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
    try {
      const payload = {
        ...form,
        conexao: Number(form.conexao),
        intervalo_segundos: Number(form.intervalo_segundos),
      };
      if (usaMock) {
        payload.dados_mock = parseDadosMock(form.dados_mock);
      } else {
        delete payload.dados_mock;
      }
      if (editId) {
        await api.put(`/consultas-sql/${editId}/`, payload);
        setMensagem("Consulta atualizada.");
      } else {
        await api.post("/consultas-sql/", payload);
        setMensagem("Consulta criada.");
      }
      resetForm();
      await carregar();
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao salvar consulta."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    const confirmado = await confirm({
      title: "Excluir consulta SQL",
      message: "Deseja excluir esta consulta? Itens de painel que a utilizam podem parar de funcionar.",
      confirmLabel: "Excluir",
    });
    if (!confirmado) return;
    try {
      await api.delete(`/consultas-sql/${id}/`);
      if (editId === id) resetForm();
      await carregar();
      setMensagem("Consulta excluída.");
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao excluir consulta."));
    }
  }

  async function executar(item) {
    setExecutandoId(item.id);
    setResultado(null);
    setErro("");
    try {
      const res = await api.post(`/consultas-sql/${item.id}/executar/`);
      setResultado({ ...res.data, nome: item.nome });
    } catch (e) {
      setErro(e.response?.data?.detail || "Erro ao executar consulta.");
    } finally {
      setExecutandoId(null);
    }
  }

  return (
    <div className="page">
      <PageHeader
        icon={FileCode2}
        title="Consultas SQL"
        subtitle="Cadastre consultas SELECT vinculadas a uma conexão para alimentar os cards dos painéis."
      />

      {mensagem && <Alert variant="success" onClose={() => setMensagem("")}>{mensagem}</Alert>}
      {erro && <Alert variant="danger" onClose={() => setErro("")}>{erro}</Alert>}

      <div className="row g-4">
        <div className="col-lg-5">
          <Surface
            sticky
            editing={Boolean(editId)}
            icon={editId ? Pencil : Plus}
            title={editId ? "Editar consulta" : "Nova consulta"}
            subtitle={editId ? form.nome : "Apenas instruções SELECT são permitidas"}
          >
            <form onSubmit={salvar} className="form-grid">
              <div>
                <label className="form-label" htmlFor="consulta-sql-conexao">Conexão</label>
                <select id="consulta-sql-conexao" className="form-select" value={form.conexao} onChange={(e) => setForm({ ...form, conexao: e.target.value })} required>
                  <option value="">Selecione...</option>
                  {conexoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="consulta-sql-nome">Nome</label>
                <input id="consulta-sql-nome" className="form-control" placeholder="Ex.: Pedidos pendentes" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div>
                <label className="form-label" htmlFor="consulta-sql-descricao">Descrição</label>
                <textarea id="consulta-sql-descricao" className="form-control" rows={2} placeholder="Opcional" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div>
                <label className="form-label" htmlFor="consulta-sql-sql">SQL</label>
                <textarea id="consulta-sql-sql" className="form-control font-monospace" rows={6} spellCheck={false} value={form.sql} onChange={(e) => setForm({ ...form, sql: e.target.value })} required />
                {usaMock && (
                  <p className="form-hint">Com conexão mock, o SQL é só referência — o resultado vem dos dados mockados abaixo.</p>
                )}
              </div>
              {usaMock && (
                <div>
                  <label className="form-label" htmlFor="consulta-sql-dados-mock">Dados mockados (JSON)</label>
                  <textarea
                    id="consulta-sql-dados-mock"
                    className="form-control font-monospace"
                    rows={8}
                    spellCheck={false}
                    value={form.dados_mock}
                    onChange={(e) => setForm({ ...form, dados_mock: e.target.value })}
                    required
                  />
                  <p className="form-hint">
                    Lista de linhas fictícias. Ex.: <code className="inline-code">[{`{"total": 12}`}]</code> ou várias linhas para o formato tabela.
                  </p>
                </div>
              )}
              <div>
                <label className="form-label" htmlFor="consulta-sql-intervalo">Intervalo de execução (segundos)</label>
                <input id="consulta-sql-intervalo" type="number" min={30} className="form-control" value={form.intervalo_segundos} onChange={(e) => setForm({ ...form, intervalo_segundos: e.target.value })} required />
              </div>
              <SwitchField
                id="ativo-sql"
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
            icon={FileCode2}
            title="Consultas cadastradas"
            subtitle="Execute para validar o retorno antes de usar no painel"
            actions={<CountPill>{itens.length}</CountPill>}
          >
            {loading && <LoadingState label="Carregando consultas..." />}
            {!loading && !itens.length && (
              <EmptyState icon={FileCode2} title="Nenhuma consulta cadastrada" description="Crie uma consulta SELECT ao lado. Você precisa de pelo menos uma conexão cadastrada." />
            )}
            {!loading && itens.length > 0 && (
              <div className="table-scroll">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="col-grow">Consulta</th>
                      <th>Intervalo</th>
                      <th>Status</th>
                      <th className="col-actions">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item) => (
                      <tr key={item.id} className={editId === item.id ? "is-editing" : ""}>
                        <td className="col-grow">
                          <div className="cell-main">
                            <span className="cell-icon cell-icon--violet"><FileCode2 size={15} /></span>
                            <div className="min-w-0">
                              <div className="cell-title">{item.nome}</div>
                              <div className="cell-sub d-flex align-items-center gap-1" title={item.descricao || item.conexao_nome}>
                                <Database size={12} className="flex-shrink-0" />
                                <span className="text-truncate">
                                  {item.conexao_nome}{item.descricao ? ` · ${item.descricao}` : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td><span className="chip"><Timer size={12} />{item.intervalo_segundos}s</span></td>
                        <td><StatusBadge ativo={item.ativo} ativoLabel="Ativa" inativoLabel="Inativa" /></td>
                        <td className="col-actions">
                          <div className="row-actions">
                            <IconButton icon={Play} label="Executar" tone="success" onClick={() => executar(item)} loading={executandoId === item.id} />
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
              icon={TableProperties}
              title={`Resultado: ${resultado.nome}`}
              subtitle={resultado.total_linhas > resultado.linhas.length
                ? `Exibindo ${resultado.linhas.length} de ${resultado.total_linhas} linhas`
                : `${resultado.total_linhas} linha(s) retornada(s)`}
              actions={<IconButton icon={X} label="Fechar resultado" onClick={() => setResultado(null)} />}
            >
              {resultado.linhas.length
                ? <DataPreviewTable linhas={resultado.linhas} />
                : <EmptyState title="A consulta não retornou linhas" description="Isso equivale ao valor 0 em cards do formato Número." />}
            </Surface>
          )}
        </div>
      </div>
    </div>
  );
}
