import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Link2, LoaderCircle, Lock, Mail, User } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { Alert } from "../components/ui";
import { api } from "../services/api";
import { saveAuth } from "../services/authStorage";
import { formatarErroApi } from "../utils/format";

export function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    organizacao_nome: "",
    organizacao_slug: "",
    nome: "",
    email: "",
    senha: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const response = await api.post("/auth/registrar/", form);
      const { access, refresh, usuario } = response.data ?? {};
      if (!access || !refresh || !usuario) {
        throw new Error("Resposta de cadastro inválida.");
      }
      saveAuth({ access, refresh, usuario });
      navigate("/home");
    } catch (error) {
      setErro(formatarErroApi(error, "Não foi possível concluir o cadastro."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card-header">
        <h2 className="auth-title">Crie sua organização</h2>
        <p className="auth-subtitle">Cadastre sua empresa e o usuário administrador em menos de um minuto.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-section-title">Organização</div>

        <div>
          <label className="form-label" htmlFor="cadastro-organizacao-nome">Nome da organização</label>
          <div className="input-icon">
            <Building2 size={16} />
            <input
              id="cadastro-organizacao-nome"
              className="form-control auth-input"
              placeholder="Minha Empresa Ltda."
              value={form.organizacao_nome}
              onChange={(e) => setForm({ ...form, organizacao_nome: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="cadastro-organizacao-slug">Identificador (slug)</label>
          <div className="input-icon">
            <Link2 size={16} />
            <input
              id="cadastro-organizacao-slug"
              className="form-control auth-input"
              placeholder="minha-empresa"
              value={form.organizacao_slug}
              onChange={(e) => setForm({ ...form, organizacao_slug: e.target.value })}
            />
          </div>
          <p className="form-hint">Opcional. Se vazio, é gerado a partir do nome.</p>
        </div>

        <div className="form-section-title">Administrador</div>

        <div>
          <label className="form-label" htmlFor="cadastro-nome">Seu nome</label>
          <div className="input-icon">
            <User size={16} />
            <input
              id="cadastro-nome"
              className="form-control auth-input"
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label className="form-label" htmlFor="cadastro-email">E-mail</label>
            <div className="input-icon">
              <Mail size={16} />
              <input
                id="cadastro-email"
                type="email"
                className="form-control auth-input"
                placeholder="voce@empresa.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="cadastro-senha">Senha</label>
            <div className="input-icon">
              <Lock size={16} />
              <input
                id="cadastro-senha"
                type="password"
                className="form-control auth-input"
                placeholder="Mín. 6 caracteres"
                minLength={6}
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {erro && <Alert variant="danger" compact>{erro}</Alert>}

        <button type="submit" className="btn btn-primary btn-lg w-100 mt-1" disabled={loading}>
          {loading ? <LoaderCircle size={16} className="spin" /> : null}
          {loading ? "Cadastrando..." : "Criar conta"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="auth-switch">
        Já tem uma conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthLayout>
  );
}
