import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Layers, LayoutGrid, ListPlus, Pencil, Plus, Timer, Trash2 } from "lucide-react";
import { useConfirm } from "../context/ConfirmDialogContext";
import {
  Alert,
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
import { formatarErroApi, gradientePorTexto } from "../utils/format";
import "../styles/Admin.css";

const FORM_VAZIO = {
  nome: "",
  descricao: "",
  intervalo_segundos: 60,
  ativo: true,
};

export function Paineis() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [itens, setItens] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregar() {
    setLoading(true);
    try {
      const res = await api.get("/paineis/");
      setItens(res.data);
    } catch {
      setErro("Não foi possível carregar os painéis.");
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

    const payload = {
      ...form,
      intervalo_segundos: Number(form.intervalo_segundos),
    };

    try {
      if (editId) {
        await api.put(`/paineis/${editId}/`, payload);
        setMensagem("Painel atualizado.");
      } else {
        const res = await api.post("/paineis/", payload);
        setMensagem("Painel criado.");
        navigate(`/paineis/${res.data.id}/editar`);
      }
      resetForm();
      await carregar();
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao salvar painel."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    const confirmado = await confirm({
      title: "Excluir painel",
      message: "Deseja excluir este painel? Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
    });
    if (!confirmado) return;
    try {
      await api.delete(`/paineis/${id}/`);
      if (editId === id) resetForm();
      await carregar();
      setMensagem("Painel excluído.");
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao excluir painel."));
    }
  }

  return (
    <div className="page">
      <PageHeader
        icon={LayoutGrid}
        title="Painéis"
        subtitle="Monte telas de monitoramento combinando suas consultas SQL e API."
      />

      {mensagem && <Alert variant="success" onClose={() => setMensagem("")}>{mensagem}</Alert>}
      {erro && <Alert variant="danger" onClose={() => setErro("")}>{erro}</Alert>}

      <div className="row g-4">
        <div className="col-lg-4">
          <Surface
            sticky
            editing={Boolean(editId)}
            icon={editId ? Pencil : Plus}
            title={editId ? "Editar painel" : "Novo painel"}
            subtitle={editId ? form.nome : "Depois de criar, adicione os itens"}
          >
            <form onSubmit={salvar} className="form-grid">
              <div>
                <label className="form-label" htmlFor="painel-nome">Nome</label>
                <input id="painel-nome" className="form-control" placeholder="Ex.: Operação logística" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div>
                <label className="form-label" htmlFor="painel-descricao">Descrição</label>
                <textarea id="painel-descricao" className="form-control" rows={2} placeholder="Opcional" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div>
                <label className="form-label" htmlFor="painel-intervalo">Intervalo de atualização (segundos)</label>
                <input id="painel-intervalo" type="number" min={15} className="form-control" value={form.intervalo_segundos} onChange={(e) => setForm({ ...form, intervalo_segundos: e.target.value })} required />
              </div>
              <SwitchField
                id="ativo-painel"
                label="Painel ativo"
                description="Painéis ativos aparecem no menu e na rotação."
                checked={form.ativo}
                onChange={(ativo) => setForm({ ...form, ativo })}
              />
              <div className="form-actions">
                <SubmitButton salvando={salvando} editando={Boolean(editId)} label="Criar painel" />
                {editId && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>}
              </div>
            </form>
          </Surface>
        </div>

        <div className="col-lg-8">
          <Surface
            flush
            icon={LayoutGrid}
            title="Painéis cadastrados"
            subtitle="Visualize, organize os itens ou edite as configurações"
            actions={<CountPill>{itens.length}</CountPill>}
          >
            {loading && <LoadingState label="Carregando painéis..." />}
            {!loading && !itens.length && (
              <EmptyState icon={LayoutGrid} title="Nenhum painel cadastrado" description="Crie o primeiro painel ao lado. Em seguida, você poderá adicionar cards com suas consultas." />
            )}
            {!loading && itens.length > 0 && (
              <div className="table-scroll">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="col-grow">Painel</th>
                      <th>Itens</th>
                      <th>Atualização</th>
                      <th>Status</th>
                      <th className="col-actions">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item) => (
                      <tr key={item.id} className={editId === item.id ? "is-editing" : ""}>
                        <td className="col-grow">
                          <div className="cell-main">
                            <span className="panel-letter" style={{ background: gradientePorTexto(item.nome) }}>
                              {(item.nome?.trim()[0] || "P").toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <div className="cell-title">{item.nome}</div>
                              {item.descricao && <div className="cell-sub cell-truncate">{item.descricao}</div>}
                            </div>
                          </div>
                        </td>
                        <td><span className="chip"><Layers size={12} />{item.total_itens}</span></td>
                        <td><span className="chip"><Timer size={12} />{item.intervalo_segundos}s</span></td>
                        <td><StatusBadge ativo={item.ativo} /></td>
                        <td className="col-actions">
                          <div className="row-actions">
                            <IconButton icon={Eye} label="Visualizar painel" tone="success" to={`/paineis/${item.id}`} />
                            <IconButton icon={ListPlus} label="Gerenciar itens" tone="primary" to={`/paineis/${item.id}/editar`} />
                            <IconButton icon={Pencil} label="Editar painel" tone="primary" onClick={() => editar(item)} />
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
