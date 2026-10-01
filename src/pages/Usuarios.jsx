import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, Pencil, ShieldCheck, ShieldOff, SlidersHorizontal, Trash2, User, UserPlus, Users } from "lucide-react";
import { PermissoesGrupoSelector } from "../components/PermissoesGrupoSelector";
import { PERMISSOES_PADRAO_USUARIO } from "../constants/permissoesTela";
import { useConfirm } from "../context/ConfirmDialogContext";
import {
  Alert,
  Avatar,
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
import { getAuthUser } from "../services/authStorage";
import { formatarErroApi } from "../utils/format";
import { PERMISSAO_LABEL } from "../utils/painelDisplay";
import "../styles/Admin.css";

const MODO_PERFIL = "perfil";
const MODO_PERSONALIZADO = "personalizado";

const TIPOS_CONTA = [
  { value: "USER", label: "Usuário", icon: User },
  { value: "ADMIN", label: "Administrador", icon: ShieldCheck },
];

const MODOS_ACESSO = [
  { value: MODO_PERFIL, label: "Perfil pronto", icon: ShieldCheck },
  { value: MODO_PERSONALIZADO, label: "Personalizado", icon: SlidersHorizontal },
];

function acessoItem(item) {
  if (item.tipo_permissao === "ADMIN") return { label: PERMISSAO_LABEL.ADMIN, tone: "violet" };
  if (item.perfil_nome) return { label: item.perfil_nome, tone: "primary" };
  if (item.personalizado) return { label: "Personalizado", tone: "warning" };
  return { label: "—", tone: "neutral" };
}

function formInicial(perfis = []) {
  const perfilPadrao = perfis.find((item) => item.nome === "Visualizador") || perfis[0];
  return {
    nome: "",
    email: "",
    senha: "",
    tipo_permissao: "USER",
    modo_acesso: perfilPadrao ? MODO_PERFIL : MODO_PERSONALIZADO,
    perfil_id: perfilPadrao?.id ?? null,
    permissoes: [...PERMISSOES_PADRAO_USUARIO],
    ativo: true,
  };
}

export function Usuarios() {
  const confirm = useConfirm();
  const usuarioLogado = getAuthUser();
  const [itens, setItens] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [catalogo, setCatalogo] = useState({ grupos: [] });
  const [form, setForm] = useState(formInicial());
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregar() {
    setLoading(true);
    try {
      const [resUsuarios, resCatalogo, resPerfis] = await Promise.all([
        api.get("/usuarios/"),
        api.get("/permissoes-tela/"),
        api.get("/perfis/"),
      ]);
      setItens(resUsuarios.data);
      setCatalogo(resCatalogo.data);
      setPerfis(resPerfis.data);
    } catch {
      setErro("Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function resetForm() {
    setForm(formInicial(perfis));
    setEditId(null);
  }

  function editar(item) {
    setEditId(item.id);
    const personalizado = item.tipo_permissao === "USER" && !item.perfil_id;
    setForm({
      nome: item.nome,
      email: item.email,
      senha: "",
      tipo_permissao: item.tipo_permissao,
      modo_acesso: personalizado ? MODO_PERSONALIZADO : MODO_PERFIL,
      perfil_id: item.perfil_id ?? null,
      permissoes: item.permissoes?.length ? item.permissoes : [...PERMISSOES_PADRAO_USUARIO],
      ativo: item.ativo,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function alterarTipoConta(tipo) {
    if (tipo === "ADMIN") {
      setForm({ ...form, tipo_permissao: tipo });
      return;
    }
    const perfilPadrao = perfis.find((item) => item.nome === "Visualizador") || perfis[0];
    setForm({
      ...form,
      tipo_permissao: tipo,
      modo_acesso: perfilPadrao ? MODO_PERFIL : MODO_PERSONALIZADO,
      perfil_id: perfilPadrao?.id ?? null,
    });
  }

  function montarPayload() {
    const payload = {
      nome: form.nome,
      email: form.email,
      tipo_permissao: form.tipo_permissao,
      ativo: form.ativo,
    };

    if (form.senha) payload.senha = form.senha;

    if (form.tipo_permissao === "ADMIN") {
      return payload;
    }

    if (form.modo_acesso === MODO_PERFIL) {
      payload.perfil_id = form.perfil_id;
      return payload;
    }

    payload.perfil_id = null;
    payload.permissoes = form.permissoes;
    return payload;
  }

  async function salvar(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setMensagem("");

    if (form.tipo_permissao === "USER" && form.modo_acesso === MODO_PERFIL && !form.perfil_id) {
      setErro("Selecione um perfil de acesso.");
      setSalvando(false);
      return;
    }

    const payload = montarPayload();

    try {
      if (editId) {
        await api.put(`/usuarios/${editId}/`, payload);
        setMensagem("Usuário atualizado.");
      } else {
        await api.post("/usuarios/", payload);
        setMensagem("Usuário criado. Compartilhe a senha definida com a pessoa convidada.");
      }
      resetForm();
      await carregar();
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao salvar usuário."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    const confirmado = await confirm({
      title: "Excluir usuário",
      message: "Deseja remover este usuário da organização?",
      confirmLabel: "Excluir",
    });
    if (!confirmado) return;
    try {
      await api.delete(`/usuarios/${id}/`);
      if (editId === id) resetForm();
      await carregar();
      setMensagem("Usuário excluído.");
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao excluir usuário."));
    }
  }

  async function resetarMfa(item) {
    const confirmado = await confirm({
      title: "Redefinir verificação em duas etapas",
      message: `${item.nome} poderá entrar só com a senha e precisará configurar o app autenticador novamente. Use quando a pessoa perder o celular.`,
      confirmLabel: "Redefinir",
    });
    if (!confirmado) return;
    try {
      await api.post(`/usuarios/${item.id}/resetar-mfa/`);
      await carregar();
      setMensagem("Verificação em duas etapas redefinida.");
    } catch (e) {
      setErro(formatarErroApi(e, "Erro ao redefinir a verificação em duas etapas."));
    }
  }

  return (
    <div className="page">
      <PageHeader
        icon={Users}
        title="Usuários"
        subtitle="Convide membros da equipe e atribua um perfil pronto ou permissões personalizadas."
        actions={(
          <Link to="/perfis" className="btn btn-outline-secondary btn-sm">
            <ShieldCheck size={14} />
            Perfis de acesso
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
            icon={editId ? Pencil : UserPlus}
            title={editId ? "Editar usuário" : "Convidar usuário"}
            subtitle={editId ? form.email : "A pessoa acessa com o e-mail e a senha definidos"}
          >
            <form onSubmit={salvar} className="form-grid">
              <div>
                <label className="form-label" htmlFor="usuario-nome">Nome</label>
                <input id="usuario-nome" className="form-control" placeholder="Nome completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="form-label" htmlFor="usuario-email">E-mail</label>
                  <input id="usuario-email" type="email" className="form-control" placeholder="pessoa@empresa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label" htmlFor="usuario-senha">Senha</label>
                  <input
                    id="usuario-senha"
                    type="password"
                    className="form-control"
                    autoComplete="new-password"
                    placeholder={editId ? "Manter atual" : "Mín. 6 caracteres"}
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    required={!editId}
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <span className="form-label d-block">Tipo de conta</span>
                <Segmented ariaLabel="Tipo de conta" value={form.tipo_permissao} options={TIPOS_CONTA} onChange={alterarTipoConta} />
              </div>

              {form.tipo_permissao === "ADMIN" && (
                <Alert variant="info" compact>
                  Administradores têm acesso total a todas as telas, incluindo a gestão de usuários.
                </Alert>
              )}

              {form.tipo_permissao === "USER" && (
                <>
                  <div>
                    <span className="form-label d-block">Forma de acesso</span>
                    <Segmented
                      ariaLabel="Forma de acesso"
                      value={form.modo_acesso}
                      options={MODOS_ACESSO}
                      onChange={(modo) => setForm({
                        ...form,
                        modo_acesso: modo,
                        perfil_id: modo === MODO_PERFIL
                          ? (form.perfil_id || perfis[0]?.id || null)
                          : form.perfil_id,
                      })}
                    />
                  </div>

                  {form.modo_acesso === MODO_PERFIL ? (
                    <div>
                      <label className="form-label" htmlFor="usuario-perfil">Perfil</label>
                      <select
                        id="usuario-perfil"
                        className="form-select"
                        value={form.perfil_id ?? ""}
                        onChange={(e) => setForm({
                          ...form,
                          perfil_id: e.target.value ? Number(e.target.value) : null,
                        })}
                        required
                      >
                        <option value="" disabled>Selecione um perfil</option>
                        {perfis.map((perfil) => (
                          <option key={perfil.id} value={perfil.id}>
                            {perfil.nome}
                            {perfil.descricao ? ` — ${perfil.descricao}` : ""}
                          </option>
                        ))}
                      </select>
                      <p className="form-hint">
                        Gerencie os perfis em <Link to="/perfis">Perfis de acesso</Link>.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="form-label d-block">Permissões personalizadas</span>
                      <PermissoesGrupoSelector
                        catalogo={catalogo}
                        selecionadas={form.permissoes}
                        onChange={(permissoes) => setForm({ ...form, permissoes })}
                        idPrefix="usuario"
                      />
                    </div>
                  )}
                </>
              )}

              <SwitchField
                id="ativo-usuario"
                label="Usuário ativo"
                description="Usuários inativos não conseguem entrar no sistema."
                checked={form.ativo}
                onChange={(ativo) => setForm({ ...form, ativo })}
              />

              <div className="form-actions">
                <SubmitButton salvando={salvando} editando={Boolean(editId)} label="Convidar usuário" />
                {editId && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>}
              </div>
            </form>
          </Surface>
        </div>

        <div className="col-lg-7">
          <Surface
            flush
            icon={Users}
            title="Usuários da organização"
            subtitle="Quem tem acesso e com qual permissão"
            actions={<CountPill>{itens.length}</CountPill>}
          >
            {loading && <LoadingState label="Carregando usuários..." />}
            {!loading && !itens.length && (
              <EmptyState icon={Users} title="Nenhum usuário cadastrado" description="Convide a primeira pessoa da equipe usando o formulário ao lado." />
            )}
            {!loading && itens.length > 0 && (
              <div className="table-scroll">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="col-grow">Usuário</th>
                      <th>Acesso</th>
                      <th>Status</th>
                      <th className="col-actions">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item) => {
                      const acesso = acessoItem(item);
                      const ehVoce = item.id === usuarioLogado?.id;
                      return (
                        <tr key={item.id} className={editId === item.id ? "is-editing" : ""}>
                          <td className="col-grow">
                            <div className="cell-main">
                              <Avatar name={item.nome} />
                              <div className="min-w-0">
                                <div className="cell-title d-flex align-items-center gap-2">
                                  {item.nome}
                                  {ehVoce && <Badge tone="primary">você</Badge>}
                                  {item.mfa_ativo && (
                                    <Badge tone="success" icon={LockKeyhole} title="Verificação em duas etapas ativa">2FA</Badge>
                                  )}
                                </div>
                                <div className="cell-sub">{item.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge tone={acesso.tone} icon={item.tipo_permissao === "ADMIN" ? ShieldCheck : undefined}>
                              {acesso.label}
                            </Badge>
                          </td>
                          <td><StatusBadge ativo={item.ativo} /></td>
                          <td className="col-actions">
                            <div className="row-actions">
                              <IconButton icon={Pencil} label="Editar" tone="primary" onClick={() => editar(item)} />
                              {item.mfa_ativo && !ehVoce && (
                                <IconButton icon={ShieldOff} label="Redefinir 2FA" onClick={() => resetarMfa(item)} />
                              )}
                              {!ehVoce && (
                                <IconButton icon={Trash2} label="Excluir" tone="danger" onClick={() => excluir(item.id)} />
                              )}
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
