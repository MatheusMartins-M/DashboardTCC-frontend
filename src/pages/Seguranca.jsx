import { useEffect, useState } from "react";
import { Copy, Download, KeyRound, LockKeyhole, RefreshCw, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { Alert, Badge, LoadingState, PageHeader, Surface } from "../components/ui";
import { api } from "../services/api";
import { updateAuthUser } from "../services/authStorage";
import { formatarErroApi } from "../utils/format";
import "../styles/Admin.css";

function CampoCodigo({ id, label = "Código do app autenticador", value, onChange, aceitaRecuperacao = false }) {
  return (
    <div>
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="form-control mfa-codigo-input"
        value={value}
        onChange={(e) => onChange(
          aceitaRecuperacao
            ? e.target.value.replace(/\s/g, "").slice(0, 11)
            : e.target.value.replace(/\D/g, "").slice(0, 6),
        )}
        inputMode={aceitaRecuperacao ? "text" : "numeric"}
        autoComplete="one-time-code"
        placeholder={aceitaRecuperacao ? "000000 ou xxxxx-xxxxx" : "000000"}
        required
      />
    </div>
  );
}

function CodigosRecuperacao({ codigos, onConcluir }) {
  const [copiado, setCopiado] = useState(false);
  const texto = codigos.join("\n");

  async function copiar() {
    await navigator.clipboard?.writeText(texto);
    setCopiado(true);
  }

  function baixar() {
    const blob = new Blob([`Códigos de recuperação — Monitor\n\n${texto}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "monitor-codigos-recuperacao.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Surface icon={KeyRound} title="Guarde seus códigos de recuperação" subtitle="Eles não serão exibidos novamente">
      <Alert variant="warning" compact>
        Cada código funciona uma única vez e permite entrar caso você perca acesso ao celular.
        Guarde-os em um local seguro, como um gerenciador de senhas.
      </Alert>
      <ul className="mfa-codigos" aria-label="Códigos de recuperação">
        {codigos.map((codigo) => <li key={codigo}>{codigo}</li>)}
      </ul>
      <div className="form-actions">
        <button type="button" className="btn btn-outline-secondary" onClick={copiar}>
          <Copy size={14} />
          {copiado ? "Copiado" : "Copiar"}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={baixar}>
          <Download size={14} />
          Baixar .txt
        </button>
        <button type="button" className="btn btn-primary ms-auto" onClick={onConcluir}>
          Já guardei os códigos
        </button>
      </div>
    </Surface>
  );
}

export function Seguranca() {
  const [status, setStatus] = useState(null);
  const [configuracao, setConfiguracao] = useState(null);
  const [codigosNovos, setCodigosNovos] = useState(null);
  const [codigoAtivacao, setCodigoAtivacao] = useState("");
  const [codigoRegenerar, setCodigoRegenerar] = useState("");
  const [desativacao, setDesativacao] = useState({ senha: "", codigo: "" });
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/auth/mfa/")
      .then((res) => setStatus(res.data))
      .catch(() => setErro("Não foi possível carregar as configurações de segurança."));
  }, []);

  async function executar(acao, mensagemErro) {
    setProcessando(true);
    setErro("");
    setMensagem("");
    try {
      await acao();
    } catch (e) {
      setErro(formatarErroApi(e, mensagemErro));
    } finally {
      setProcessando(false);
    }
  }

  function iniciarConfiguracao() {
    return executar(async () => {
      const res = await api.post("/auth/mfa/configurar/");
      setConfiguracao(res.data);
      setCodigoAtivacao("");
    }, "Não foi possível iniciar a configuração.");
  }

  function confirmarAtivacao(event) {
    event.preventDefault();
    return executar(async () => {
      const res = await api.post("/auth/mfa/ativar/", { codigo: codigoAtivacao });
      const { codigos_backup: codigos, ...novoStatus } = res.data;
      setStatus(novoStatus);
      setConfiguracao(null);
      setCodigosNovos(codigos);
      updateAuthUser({ mfa_ativo: true });
      setMensagem("Verificação em duas etapas ativada.");
    }, "Não foi possível ativar a verificação.");
  }

  function regenerarCodigos(event) {
    event.preventDefault();
    return executar(async () => {
      const res = await api.post("/auth/mfa/codigos-backup/", { codigo: codigoRegenerar });
      const { codigos_backup: codigos, ...novoStatus } = res.data;
      setStatus(novoStatus);
      setCodigosNovos(codigos);
      setCodigoRegenerar("");
      setMensagem("Novos códigos de recuperação gerados. Os anteriores deixaram de funcionar.");
    }, "Não foi possível gerar novos códigos.");
  }

  function desativar(event) {
    event.preventDefault();
    return executar(async () => {
      const res = await api.post("/auth/mfa/desativar/", desativacao);
      setStatus(res.data);
      setDesativacao({ senha: "", codigo: "" });
      updateAuthUser({ mfa_ativo: false });
      setMensagem("Verificação em duas etapas desativada.");
    }, "Não foi possível desativar a verificação.");
  }

  return (
    <div className="page">
      <PageHeader
        icon={LockKeyhole}
        title="Segurança"
        subtitle="Proteja sua conta exigindo um código do celular além da senha."
      />

      {mensagem && <Alert variant="success" onClose={() => setMensagem("")}>{mensagem}</Alert>}
      {erro && <Alert variant="danger" onClose={() => setErro("")}>{erro}</Alert>}

      {!status && !erro && <LoadingState label="Carregando..." />}

      {status && codigosNovos && (
        <CodigosRecuperacao codigos={codigosNovos} onConcluir={() => setCodigosNovos(null)} />
      )}

      {status && !codigosNovos && !status.ativo && !configuracao && (
        <Surface
          icon={ShieldCheck}
          title="Verificação em duas etapas"
          subtitle="Use um app autenticador, como Google Authenticator, Microsoft Authenticator ou Authy"
          actions={<Badge tone="neutral" dot>Desativada</Badge>}
        >
          <p className="mfa-texto">
            Com a verificação ativa, além da senha será pedido um código de 6 dígitos gerado pelo app
            no seu celular. Mesmo que alguém descubra sua senha, não conseguirá entrar sem o celular.
          </p>
          <button type="button" className="btn btn-primary" onClick={iniciarConfiguracao} disabled={processando}>
            <ShieldCheck size={14} />
            Ativar verificação em duas etapas
          </button>
        </Surface>
      )}

      {status && !codigosNovos && !status.ativo && configuracao && (
        <Surface icon={Smartphone} title="Configure o app autenticador" subtitle="Leva menos de um minuto">
          <div className="mfa-setup">
            <img className="mfa-qr" src={configuracao.qr_code} alt="QR code para o app autenticador" />
            <div className="mfa-setup-passos">
              <ol className="mfa-passos">
                <li>Abra o app autenticador e escolha adicionar uma conta.</li>
                <li>Escaneie o QR code ao lado.</li>
                <li>Digite abaixo o código de 6 dígitos que aparecer no app.</li>
              </ol>
              <p className="form-hint">
                Não consegue escanear? Digite esta chave no app:{" "}
                <code className="inline-code mfa-chave">{configuracao.segredo}</code>
              </p>
              <form onSubmit={confirmarAtivacao} className="form-grid">
                <CampoCodigo id="mfa-codigo-ativacao" value={codigoAtivacao} onChange={setCodigoAtivacao} />
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={processando}>Confirmar ativação</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setConfiguracao(null)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Surface>
      )}

      {status && !codigosNovos && status.ativo && (
        <div className="row g-4">
          <div className="col-12">
            <Surface
              icon={ShieldCheck}
              title="Verificação em duas etapas"
              subtitle="Sua conta pede um código do app autenticador a cada login"
              actions={<Badge tone="success" dot>Ativada</Badge>}
            >
              <p className="mfa-texto mb-0">
                Códigos de recuperação disponíveis: <strong>{status.codigos_backup_restantes}</strong>
                {status.codigos_backup_restantes <= 2 && " — gere novos códigos para não ficar sem acesso."}
              </p>
            </Surface>
          </div>
          <div className="col-lg-6">
            <Surface icon={RefreshCw} title="Novos códigos de recuperação" subtitle="Os códigos atuais deixam de funcionar">
              <form onSubmit={regenerarCodigos} className="form-grid">
                <CampoCodigo id="mfa-codigo-regenerar" value={codigoRegenerar} onChange={setCodigoRegenerar} />
                <div className="form-actions">
                  <button type="submit" className="btn btn-outline-primary" disabled={processando}>Gerar novos códigos</button>
                </div>
              </form>
            </Surface>
          </div>
          <div className="col-lg-6">
            <Surface icon={ShieldOff} title="Desativar verificação" subtitle="Sua conta volta a pedir apenas a senha">
              <form onSubmit={desativar} className="form-grid">
                <div>
                  <label className="form-label" htmlFor="mfa-senha">Senha atual</label>
                  <input
                    id="mfa-senha"
                    type="password"
                    className="form-control"
                    autoComplete="current-password"
                    value={desativacao.senha}
                    onChange={(e) => setDesativacao({ ...desativacao, senha: e.target.value })}
                    required
                  />
                </div>
                <CampoCodigo
                  id="mfa-codigo-desativar"
                  label="Código do app ou de recuperação"
                  aceitaRecuperacao
                  value={desativacao.codigo}
                  onChange={(codigo) => setDesativacao({ ...desativacao, codigo })}
                />
                <div className="form-actions">
                  <button type="submit" className="btn btn-danger" disabled={processando}>Desativar</button>
                </div>
              </form>
            </Surface>
          </div>
        </div>
      )}
    </div>
  );
}
