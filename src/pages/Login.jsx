import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, Lock, Mail, ShieldCheck } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { Alert } from "../components/ui";
import { api } from "../services/api";
import { isAuthenticated, saveAuth } from "../services/authStorage";

const MODOS_CODIGO = {
  app: {
    rotulo: "Código de verificação",
    dica: "Abra o app autenticador no celular e digite o código de 6 dígitos.",
    placeholder: "000000",
    inputMode: "numeric",
    maxLength: 6,
    alternarPara: "Usar um código de recuperação",
    normalizar: (valor) => valor.replace(/\D/g, "").slice(0, 6),
  },
  recuperacao: {
    rotulo: "Código de recuperação",
    dica: "Digite um dos códigos de recuperação que você guardou ao ativar a verificação.",
    placeholder: "xxxxx-xxxxx",
    inputMode: "text",
    maxLength: 11,
    alternarPara: "Usar o app autenticador",
    normalizar: (valor) => valor,
  },
};

function mensagemDeErro(error, padrao) {
  const mensagemAPI = error.response?.data?.detail || error.response?.data?.message;
  return mensagemAPI || error.message || padrao;
}

function extrairSessao(dados) {
  const { access, refresh, usuario } = dados ?? {};
  if (!access || !refresh || !usuario) {
    throw new Error("Resposta de autenticação inválida.");
  }
  return { access, refresh, usuario };
}

function BotaoEnviar({ loading, rotulo, rotuloCarregando }) {
  return (
    <button type="submit" className="btn btn-primary btn-lg w-100 mt-1" disabled={loading}>
      {loading && <LoaderCircle size={16} className="spin" />}
      {loading ? rotuloCarregando : rotulo}
      {!loading && <ArrowRight size={16} />}
    </button>
  );
}

function VerificacaoDuasEtapas({ mfaToken, onAutenticado, onReiniciar }) {
  const [codigo, setCodigo] = useState("");
  const [modoId, setModoId] = useState("app");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const modo = MODOS_CODIGO[modoId];

  async function handleVerificar(event) {
    event.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const response = await api.post("/auth/mfa/verificar/", { mfa_token: mfaToken, codigo });
      onAutenticado(extrairSessao(response.data));
    } catch (error) {
      const mensagem = mensagemDeErro(error, "Não foi possível verificar o código.");
      if (error.response?.data?.reiniciar_login) {
        onReiniciar(mensagem);
        return;
      }
      setErro(mensagem);
      setCodigo("");
    } finally {
      setLoading(false);
    }
  }

  function alternarModo() {
    setModoId((atual) => (atual === "app" ? "recuperacao" : "app"));
    setCodigo("");
    setErro("");
  }

  return (
    <AuthLayout>
      <div className="auth-card-header">
        <div className="auth-step-icon"><ShieldCheck size={20} /></div>
        <h2 className="auth-title">Verificação em duas etapas</h2>
        <p className="auth-subtitle">{modo.dica}</p>
      </div>

      <form onSubmit={handleVerificar} className="form-grid">
        <div>
          <label htmlFor="codigo" className="form-label">{modo.rotulo}</label>
          <div className="input-icon">
            <KeyRound size={16} />
            <input
              id="codigo"
              className="form-control auth-input auth-input--codigo"
              value={codigo}
              onChange={(e) => setCodigo(modo.normalizar(e.target.value))}
              inputMode={modo.inputMode}
              autoComplete="one-time-code"
              placeholder={modo.placeholder}
              maxLength={modo.maxLength}
              autoFocus
              required
            />
          </div>
        </div>

        {erro && <Alert variant="danger" compact>{erro}</Alert>}

        <BotaoEnviar loading={loading} rotulo="Verificar" rotuloCarregando="Verificando..." />
      </form>

      <div className="auth-mfa-links">
        <button type="button" className="btn btn-link btn-sm p-0" onClick={alternarModo}>
          {modo.alternarPara}
        </button>
        <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onReiniciar("")}>
          Voltar ao login
        </button>
      </div>
    </AuthLayout>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mfaToken, setMfaToken] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  function entrar(sessao) {
    saveAuth(sessao);
    navigate("/home");
  }

  function voltarParaSenha(mensagem) {
    setMfaToken("");
    setErro(mensagem);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setLoading(true);

    try {
      if (!email || !senha) {
        throw new Error("Informe e-mail e senha.");
      }

      const { data } = await api.post("/auth/login/", { email, senha });
      if (data?.mfa_requerido && data.mfa_token) {
        setMfaToken(data.mfa_token);
        return;
      }
      entrar(extrairSessao(data));
    } catch (error) {
      setErro(mensagemDeErro(error, "Falha ao fazer login. Tente novamente."));
    } finally {
      setLoading(false);
    }
  }

  if (mfaToken) {
    return <VerificacaoDuasEtapas mfaToken={mfaToken} onAutenticado={entrar} onReiniciar={voltarParaSenha} />;
  }

  const rotuloSenha = mostrarSenha ? "Ocultar senha" : "Mostrar senha";

  return (
    <AuthLayout>
      <div className="auth-card-header">
        <h2 className="auth-title">Bem-vindo de volta</h2>
        <p className="auth-subtitle">Entre com suas credenciais para acessar seus painéis.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div>
          <label htmlFor="email" className="form-label">E-mail</label>
          <div className="input-icon">
            <Mail size={16} />
            <input
              id="email"
              type="email"
              className="form-control auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="username"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="senha" className="form-label">Senha</label>
          <div className="input-icon auth-password">
            <Lock size={16} />
            <input
              id="senha"
              type={mostrarSenha ? "text" : "password"}
              className="form-control auth-input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setMostrarSenha((atual) => !atual)}
              aria-label={rotuloSenha}
              title={rotuloSenha}
            >
              {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {erro && <Alert variant="danger" compact>{erro}</Alert>}

        <BotaoEnviar loading={loading} rotulo="Entrar" rotuloCarregando="Entrando..." />
      </form>

      <div className="auth-divider"><span>Novo por aqui?</span></div>

      <Link to="/cadastro" className="btn btn-outline-secondary w-100">
        Cadastrar nova organização
      </Link>
    </AuthLayout>
  );
}
