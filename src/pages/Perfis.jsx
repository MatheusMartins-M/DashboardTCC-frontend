import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Lock, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { PermissoesGrupoSelector } from "../components/PermissoesGrupoSelector";
import { useConfirm } from "../context/ConfirmDialogContext";
import {
  Alert,
  Badge,
  CountPill,
  EmptyState,
  IconButton,
  LoadingState,
  PageHeader,
  Surface,
  SubmitButton,
} from "../components/ui";
import { api } from "../services/api";
import { formatarErroApi } from "../utils/format";
import "../styles/Admin.css";

const FORM_VAZIO = {
  nome: "",
  descricao: "",
  permissoes: [],
};

export function Perfis() {
  const confirm = useConfirm();
  const [itens, setItens] = useState([]);
  const [catalogo, setCatalogo] = useState({ grupos: [] });
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregar() {
    setLoading(true);
    try {
      const [resPerfis, resCatalogo] = await Promise.all([
        api.get("/perfis/"),
        api.get("/permissoes-tela/"),
      ]);
      setItens(resPerfis.data);
      setCatalogo(resCatalogo.data);
    } catch {
      setErro("Não foi possível carregar os perfis.");
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
      permissoes: item.permissoes || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setMensagem("");

    try {
      if (editId) {
        await api.put(`/perfis/${editId}/`, form);
        setMensagem("Perfil atualizado.");
      } else {
        await api.post("/perfis/", form);
        setMensagem("Perfil criado.");
      }
      resetForm();
      await carregar();
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao salvar perfil."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    const confirmado = await confirm({
      title: "Excluir perfil",
      message: "Deseja remover este perfil de acesso?",
      confirmLabel: "Excluir",
    });
    if (!confirmado) return;

    try {
      await api.delete(`/perfis/${id}/`);
      if (editId === id) resetForm();
      await carregar();
      setMensagem("Perfil excluído.");
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao excluir perfil."));
    }
  }

  return (
    <div className="page">
      <PageHeader
        icon={ShieldCheck}
        title="Perfis de acesso"
        subtitle="Defina conjuntos de permissões reutilizáveis para atribuir aos usuários com um clique."
        actions={(
          <Link to="/usuarios" className="btn btn-outline-secondary btn-sm">
            <Users size={14} />
            Usuários
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
            title={editId ? "Editar perfil" : "Novo perfil"}
            subtitle={editId ? form.nome : "Escolha quais telas o perfil pode acessar"}
          >
            <form onSubmit={salvar} className="form-grid">
              <div>
                <label className="form-label" htmlFor="perfil-nome">Nome</label>
                <input
                  id="perfil-nome"
                  className="form-control"
                  placeholder="Ex.: Operador"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label" htmlFor="perfil-descricao">Descrição</label>
                <input
                  id="perfil-descricao"
                  className="form-control"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <span className="form-label d-block">Permissões do perfil</span>
                <PermissoesGrupoSelector
                  catalogo={catalogo}
                  selecionadas={form.permissoes}
                  onChange={(permissoes) => setForm({ ...form, permissoes })}
                  idPrefix="perfil"
                />
              </div>
              <div className="form-actions">
                <SubmitButton salvando={salvando} editando={Boolean(editId)} label="Criar perfil" />
                {editId && (
                  <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </Surface>
        </div>

        <div className="col-lg-7">
          <Surface
            flush
            icon={ShieldCheck}
            title="Perfis da organização"
            subtitle="Perfis padrão não podem ser excluídos"
            actions={<CountPill>{itens.length}</CountPill>}
          >
            {loading && <LoadingState label="Carregando perfis..." />}
            {!loading && !itens.length && (
              <EmptyState icon={ShieldCheck} title="Nenhum perfil cadastrado" description="Crie um perfil ao lado para reutilizar conjuntos de permissões." />
            )}
            {!loading && itens.length > 0 && (
              <div className="table-scroll">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="col-grow">Perfil</th>
                      <th>Permissões</th>
                      <th>Tipo</th>
                      <th className="col-actions">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item) => (
                      <tr key={item.id} className={editId === item.id ? "is-editing" : ""}>
                        <td className="col-grow">
                          <div className="cell-main">
                            <span className={`cell-icon ${item.padrao ? "cell-icon--info" : "cell-icon--primary"}`}>
                              <ShieldCheck size={15} />
                            </span>
                            <div className="min-w-0">
                              <div className="cell-title">{item.nome}</div>
                              <div className="cell-sub cell-truncate">{item.descricao || "Sem descrição"}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="chip"><KeyRound size={12} />{(item.permissoes || []).length} tela(s)</span></td>
                        <td>
                          {item.padrao
                            ? <Badge tone="info" icon={Lock}>Padrão</Badge>
                            : <Badge tone="neutral">Customizado</Badge>}
                        </td>
                        <td className="col-actions">
                          <div className="row-actions">
                            <IconButton icon={Pencil} label="Editar" tone="primary" onClick={() => editar(item)} />
                            {!item.padrao && (
                              <IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => excluir(item.id)} />
                            )}
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
