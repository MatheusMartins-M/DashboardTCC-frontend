import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  Eye,
  FileCode2,
  Globe,
  Hash,
  Layers,
  Lightbulb,
  Palette,
  Pencil,
  Plus,
  Table2,
  Trash2,
} from "lucide-react";
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

const REGRAS_PADRAO = [
  { ate: 10, cor: "#039C08", rotulo: "Normal" },
  { ate: 50, cor: "#D19D0D", rotulo: "Atenção" },
  { cor: "#810600", rotulo: "Crítico" },
];

const FORM_VAZIO = {
  titulo: "",
  tipo: "sql",
  consulta_sql: "",
  consulta_api: "",
  formato: "numero",
  campo_valor: "",
  regras_cor: JSON.stringify(REGRAS_PADRAO, null, 2),
  ordem: 0,
  ativo: true,
};

const TIPOS_ITEM = [
  { value: "sql", label: "Consulta SQL", icon: FileCode2 },
  { value: "api", label: "Consulta API", icon: Globe },
];

const FORMATOS = [
  { value: "numero", label: "Número", icon: Hash },
  { value: "tabela", label: "Tabela", icon: Table2 },
];

const AJUDA_FORMATO = {
  numero: "Exibe um número grande no card. Use COUNT(*) para quantidades, ou SELECT 1 / id quando quiser 0 (vazio) vs 1+ (há registros). As regras de cor aplicam-se ao número exibido.",
  tabela: "Mostra quantas linhas a consulta retornou e uma amostra das primeiras linhas. A cor usa a quantidade de linhas.",
};

function lerRegras(texto) {
  try {
    const regras = JSON.parse(texto || "[]");
    return Array.isArray(regras) ? regras : null;
  } catch {
    return null;
  }
}

function RegrasPreview({ texto }) {
  const regras = useMemo(() => lerRegras(texto), [texto]);

  if (!regras) {
    return <p className="form-hint text-danger">JSON inválido — corrija para visualizar as faixas.</p>;
  }
  if (!regras.length) return null;

  return (
    <div className="regras-preview">
      {regras.map((regra) => (
        <span className="regras-preview-item" key={`${regra.ate ?? "acima"}-${regra.rotulo}-${regra.cor}`}>
          <span className="regras-preview-swatch" style={{ background: regra.cor || "#94a3b8" }} />
          <strong>{regra.rotulo || "Sem rótulo"}</strong>
          <span>{regra.ate != null ? `até ${regra.ate}` : "acima"}</span>
        </span>
      ))}
    </div>
  );
}

export function PainelEditar() {
  const { id } = useParams();
  const confirm = useConfirm();
  const [painel, setPainel] = useState(null);
  const [itens, setItens] = useState([]);
  const [consultasSql, setConsultasSql] = useState([]);
  const [consultasApi, setConsultasApi] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregar() {
    setLoading(true);
    try {
      const [resPainel, resItens, resSql, resApi] = await Promise.all([
        api.get(`/paineis/${id}/`),
        api.get(`/painel-itens/?painel=${id}`),
        api.get("/consultas-sql/"),
        api.get("/consultas-api/"),
      ]);
      setPainel(resPainel.data);
      setItens(resItens.data);
      setConsultasSql(resSql.data);
      setConsultasApi(resApi.data);
    } catch {
      setErro("Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [id]);

  function resetForm() {
    setForm(FORM_VAZIO);
    setEditId(null);
  }

  function editar(item) {
    setEditId(item.id);
    setForm({
      titulo: item.titulo,
      tipo: item.tipo,
      consulta_sql: item.consulta_sql || "",
      consulta_api: item.consulta_api || "",
      formato: item.formato === "status" ? "numero" : item.formato,
      campo_valor: item.campo_valor || "",
      regras_cor: JSON.stringify(item.regras_cor?.length ? item.regras_cor : REGRAS_PADRAO, null, 2),
      ordem: item.ordem,
      ativo: item.ativo,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setMensagem("");

    const regras_cor = lerRegras(form.regras_cor);
    if (!regras_cor) {
      setErro("Regras de cor devem ser um JSON válido (uma lista).");
      setSalvando(false);
      return;
    }

    const payload = {
      painel: Number(id),
      titulo: form.titulo,
      tipo: form.tipo,
      formato: form.formato,
      campo_valor: form.campo_valor,
      regras_cor,
      ordem: Number(form.ordem),
      ativo: form.ativo,
      consulta_sql: form.tipo === "sql" ? Number(form.consulta_sql) : null,
      consulta_api: form.tipo === "api" ? Number(form.consulta_api) : null,
    };

    try {
      if (editId) {
        await api.put(`/painel-itens/${editId}/`, payload);
        setMensagem("Item atualizado.");
      } else {
        await api.post("/painel-itens/", payload);
        setMensagem("Item adicionado.");
      }
      resetForm();
      await carregar();
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao salvar item."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(itemId) {
    const confirmado = await confirm({
      title: "Excluir item do painel",
      message: "Deseja excluir este item do painel?",
      confirmLabel: "Excluir",
    });
    if (!confirmado) return;
    try {
      await api.delete(`/painel-itens/${itemId}/`);
      if (editId === itemId) resetForm();
      await carregar();
      setMensagem("Item excluído.");
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao excluir item."));
    }
  }

  if (loading && !painel) return <LoadingState label="Carregando painel..." page />;

  return (
    <div className="page">
      <PageHeader
        icon={Layers}
        eyebrow={(
          <>
            <Link to="/paineis">Painéis</Link>
            <ChevronRight size={12} />
            <span>{painel?.nome}</span>
          </>
        )}
        title="Itens do painel"
        subtitle="Adicione consultas SQL ou API como cards e defina as faixas de criticidade."
        actions={(
          <Link to={`/paineis/${id}`} className="btn btn-primary btn-sm">
            <Eye size={14} />
            Ver painel
          </Link>
        )}
      />

      {mensagem && <Alert variant="success" onClose={() => setMensagem("")}>{mensagem}</Alert>}
      {erro && <Alert variant="danger" onClose={() => setErro("")}>{erro}</Alert>}

      <div className="row g-4">
        <div className="col-lg-5">
          <Surface
            sticky
            editing={Boolean(editId)}
            icon={editId ? Pencil : Plus}
            title={editId ? "Editar item" : "Novo item"}
            subtitle={editId ? form.titulo : "Cada item vira um card no painel"}
          >
            <form onSubmit={salvar} className="form-grid">
              <div>
                <label className="form-label" htmlFor="titulo-item">Título do card</label>
                <input id="titulo-item" className="form-control" placeholder="Ex.: Pedidos pendentes" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
              </div>

              <div>
                <span className="form-label d-block">Fonte de dados</span>
                <Segmented ariaLabel="Tipo do item" value={form.tipo} options={TIPOS_ITEM} onChange={(tipo) => setForm({ ...form, tipo })} />
              </div>

              {form.tipo === "sql" ? (
                <>
                  <div>
                    <label className="form-label" htmlFor="consulta-sql-item">Consulta SQL</label>
                    <select id="consulta-sql-item" className="form-select" value={form.consulta_sql} onChange={(e) => setForm({ ...form, consulta_sql: e.target.value })} required>
                      <option value="">Selecione...</option>
                      {consultasSql.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="form-label d-block">Formato de exibição</span>
                    <Segmented ariaLabel="Formato" value={form.formato} options={FORMATOS} onChange={(formato) => setForm({ ...form, formato })} />
                    <p className="form-hint">{AJUDA_FORMATO[form.formato]}</p>
                  </div>
                  {form.formato === "numero" && (
                    <div>
                      <label className="form-label" htmlFor="campo-valor-item">Campo para valor</label>
                      <input
                        id="campo-valor-item"
                        className="form-control font-monospace"
                        placeholder="Ex.: total, quantidade, qtd"
                        value={form.campo_valor}
                        onChange={(e) => setForm({ ...form, campo_valor: e.target.value })}
                      />
                      <p className="form-hint">
                        Opcional. Se vazio, usa a única coluna ou a primeira da primeira linha.
                        Ex.: <code className="inline-code">SELECT COUNT(*) AS total FROM pedidos</code>
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="form-label" htmlFor="consulta-api-item">Consulta API</label>
                  <select id="consulta-api-item" className="form-select" value={form.consulta_api} onChange={(e) => setForm({ ...form, consulta_api: e.target.value })} required>
                    <option value="">Selecione...</option>
                    {consultasApi.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <p className="form-hint">O card mostrará OK ou Falha conforme o status HTTP esperado na consulta.</p>
                </div>
              )}

              <div>
                <label className="form-label d-flex align-items-center gap-2" htmlFor="regras-item">
                  <Palette size={13} />
                  Regras de cor e criticidade (JSON)
                </label>
                <textarea id="regras-item" className="form-control font-monospace" rows={6} spellCheck={false} value={form.regras_cor} onChange={(e) => setForm({ ...form, regras_cor: e.target.value })} />
                <RegrasPreview texto={form.regras_cor} />
                <p className="form-hint">Cada regra aceita <code className="inline-code">ate</code>, <code className="inline-code">cor</code> e <code className="inline-code">rotulo</code>. A última regra, sem <code className="inline-code">ate</code>, vale para valores acima.</p>
              </div>

              <div>
                <label className="form-label" htmlFor="ordem-item">Ordem de exibição</label>
                <input id="ordem-item" type="number" min={0} className="form-control" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: e.target.value })} />
                <p className="form-hint">Número menor aparece primeiro. Empates seguem a ordem de cadastro.</p>
              </div>

              <SwitchField
                id="ativo-item"
                label="Item ativo no painel"
                description="Itens inativos ficam ocultos na visualização."
                checked={form.ativo}
                onChange={(ativo) => setForm({ ...form, ativo })}
              />

              <div className="form-actions">
                <SubmitButton salvando={salvando} editando={Boolean(editId)} label="Adicionar item" />
                {editId && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>}
              </div>
            </form>
          </Surface>
        </div>

        <div className="col-lg-7">
          <div className="tip-card mb-4">
            <div className="tip-card-icon"><Lightbulb size={16} /></div>
            <div>
              <p className="tip-card-title">Guia rápido</p>
              <ul className="tip-card-list">
                <li><strong>Número:</strong> COUNT, SUM, ou consultas que retornam 0/1 para “tem pendência?”.</li>
                <li><strong>Tabela:</strong> quando precisa ver uma amostra dos dados, não só um total.</li>
                <li><strong>Campo para valor:</strong> nome da coluna quando a query retorna várias (só no formato Número).</li>
                <li><strong>Ordem:</strong> 0 = primeiro card; 1 = segundo; e assim por diante.</li>
              </ul>
            </div>
          </div>

          <Surface
            flush
            icon={Layers}
            title="Itens do painel"
            subtitle="Ordenados como aparecem na visualização"
            actions={<CountPill>{itens.length}</CountPill>}
          >
            {!itens.length ? (
              <EmptyState icon={Layers} title="Nenhum item no painel" description="Adicione o primeiro card usando o formulário ao lado." />
            ) : (
              <div className="table-scroll">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Ordem</th>
                      <th className="col-grow">Card</th>
                      <th>Fonte</th>
                      <th>Status</th>
                      <th className="col-actions">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item) => (
                      <tr key={item.id} className={editId === item.id ? "is-editing" : ""}>
                        <td><span className="order-pill">{item.ordem}</span></td>
                        <td className="col-grow">
                          <div className="cell-title">{item.titulo}</div>
                          {item.tipo === "sql" && (
                            <div className="cell-sub">{item.formato === "tabela" ? "Formato tabela" : "Formato número"}</div>
                          )}
                        </td>
                        <td>
                          <Badge tone={item.tipo === "api" ? "info" : "violet"} icon={item.tipo === "api" ? Globe : FileCode2}>
                            {item.tipo.toUpperCase()}
                          </Badge>
                        </td>
                        <td><StatusBadge ativo={item.ativo} /></td>
                        <td className="col-actions">
                          <div className="row-actions">
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
        </div>
      </div>
    </div>
  );
}
