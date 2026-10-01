import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Database,
  FileCode2,
  Globe,
  History,
  Layers,
  LayoutGrid,
  MonitorPlay,
  Plus,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { Alert, EmptyState, LoadingState, StatCard, Surface } from "../components/ui";
import { api } from "../services/api";
import { getAuthUser, hasPermissao } from "../services/authStorage";
import { formatarErroApi, gradientePorTexto } from "../utils/format";
import { PERMISSAO_LABEL } from "../utils/painelDisplay";
import "../styles/Home.css";

const configSections = [
  { key: "conexoes", title: "Conexões de banco", desc: "Servidores SQL Server, MySQL e conexões mock.", path: "/conexoes", permissao: "gerenciar_conexoes", icon: Database, tone: "info" },
  { key: "sql", title: "Consultas SQL", desc: "Consultas SELECT que alimentam os cards.", path: "/consultas-sql", permissao: "gerenciar_consultas_sql", icon: FileCode2, tone: "violet" },
  { key: "api", title: "Consultas API", desc: "Endpoints HTTP com status esperado.", path: "/consultas-api", permissao: "gerenciar_consultas_api", icon: Globe, tone: "success" },
  { key: "paineis-admin", title: "Gerenciar painéis", desc: "Crie painéis e organize seus itens.", path: "/paineis", permissao: "gerenciar_paineis", icon: LayoutGrid, tone: "primary" },
  { key: "usuarios", title: "Usuários", desc: "Convide pessoas e defina acessos.", path: "/usuarios", permissao: "gerenciar_usuarios", icon: Users, tone: "warning" },
  { key: "perfis", title: "Perfis de acesso", desc: "Conjuntos de permissões reutilizáveis.", path: "/perfis", permissao: "gerenciar_usuarios", icon: ShieldCheck, tone: "danger" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function primeiroNome(nome) {
  return String(nome || "").trim().split(/\s+/)[0] || "";
}

export function Home() {
  const navigate = useNavigate();
  const usuarioLogado = useMemo(() => getAuthUser(), []);
  const podeVerPaineis = hasPermissao("ver_paineis");
  const podeGerenciarPaineis = hasPermissao("gerenciar_paineis");
  const podeVerRotacao = hasPermissao("ver_rotacao");
  const podeVerHistorico = hasPermissao("ver_historico");
  const sectionsVisiveis = configSections.filter((section) => hasPermissao(section.permissao));
  const [paineis, setPaineis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carregandoDemo, setCarregandoDemo] = useState(false);
  const [mensagemDemo, setMensagemDemo] = useState("");
  const [erroDemo, setErroDemo] = useState("");

  const totalItens = paineis.reduce((acc, painel) => acc + (painel.total_itens || 0), 0);
  const menorIntervalo = paineis.length
    ? Math.min(...paineis.map((painel) => painel.intervalo_segundos || 0))
    : null;
  const dataExtenso = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const dataHoje = dataExtenso.charAt(0).toUpperCase() + dataExtenso.slice(1);

  async function carregarPaineis() {
    if (!podeVerPaineis) {
      setPaineis([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/paineis/");
      setPaineis(res.data.filter((p) => p.ativo));
    } catch {
      setPaineis([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPaineis();
  }, [podeVerPaineis]);

  async function carregarDemo() {
    setCarregandoDemo(true);
    setMensagemDemo("");
    setErroDemo("");
    try {
      const res = await api.post("/demo/carregar/");
      setMensagemDemo(res.data.detail || "Demonstração carregada.");
      await carregarPaineis();
    } catch (e) {
      setErroDemo(formatarErroApi(e, "Não foi possível carregar a demonstração."));
    } finally {
      setCarregandoDemo(false);
    }
  }

  const semAcesso = !podeVerPaineis && !sectionsVisiveis.length && !podeVerRotacao && !podeVerHistorico;

  return (
    <div className="page">
      <section className="home-hero">
        <div className="home-hero-grid" />
        <div className="home-hero-glow" />
        <div className="home-hero-content">
          <span className="home-hero-date">
            <CalendarDays size={13} />
            {dataHoje}
          </span>
          <h1 className="home-hero-title">
            {getGreeting()}{usuarioLogado?.nome ? `, ${primeiroNome(usuarioLogado.nome)}` : ""}!
          </h1>
          <p className="home-hero-subtitle">
            {usuarioLogado?.organizacao?.nome
              ? <>Acompanhe os indicadores da <strong>{usuarioLogado.organizacao.nome}</strong> em tempo real.</>
              : "Selecione um painel para começar a monitorar."}
          </p>
        </div>
        {(podeVerRotacao || podeVerHistorico) && (
          <div className="home-hero-actions">
            {podeVerRotacao && (
              <button type="button" className="btn home-hero-btn home-hero-btn--solid" onClick={() => navigate("/rotacao")}>
                <MonitorPlay size={16} />
                Rotação em tela cheia
              </button>
            )}
            {podeVerHistorico && (
              <button type="button" className="btn home-hero-btn" onClick={() => navigate("/historico")}>
                <History size={16} />
                Histórico e alertas
              </button>
            )}
          </div>
        )}
      </section>

      {(mensagemDemo || erroDemo) && (
        <Alert
          variant={erroDemo ? "danger" : "success"}
          onClose={() => { setMensagemDemo(""); setErroDemo(""); }}
        >
          {erroDemo || mensagemDemo}
        </Alert>
      )}

      {podeVerPaineis && (
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-xl-3 fade-up" style={{ "--i": 1 }}>
            <StatCard icon={LayoutGrid} tone="primary" label="Painéis ativos" value={loading ? "—" : paineis.length} hint="Disponíveis para você" />
          </div>
          <div className="col-sm-6 col-xl-3 fade-up" style={{ "--i": 2 }}>
            <StatCard icon={Activity} tone="success" label="Itens monitorados" value={loading ? "—" : totalItens} hint="Somando todos os painéis" />
          </div>
          <div className="col-sm-6 col-xl-3 fade-up" style={{ "--i": 3 }}>
            <StatCard icon={Timer} tone="info" label="Atualização mais rápida" value={loading || menorIntervalo == null ? "—" : `${menorIntervalo}s`} hint="Menor intervalo configurado" />
          </div>
          <div className="col-sm-6 col-xl-3 fade-up" style={{ "--i": 4 }}>
            <StatCard icon={ShieldCheck} tone="violet" compact label="Seu acesso" value={PERMISSAO_LABEL[usuarioLogado?.tipo_permissao] || "Usuário"} hint={`${usuarioLogado?.permissoes?.length ?? 0} permissão(ões)`} />
          </div>
        </div>
      )}

      {podeVerPaineis && (
        <section className="mb-4">
          <div className="home-section-header">
            <div>
              <h2 className="home-section-title">Painéis de monitoramento</h2>
              <p className="home-section-subtitle">Clique em um painel para ver os indicadores ao vivo.</p>
            </div>
            {podeGerenciarPaineis && paineis.length > 0 && (
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/paineis")}>
                <Plus size={14} />
                Novo painel
              </button>
            )}
          </div>

          {loading && <Surface><LoadingState label="Carregando painéis..." /></Surface>}

          {!loading && paineis.length > 0 && (
            <div className="home-panels-grid">
              {paineis.map((painel, index) => (
                <button
                  key={painel.id}
                  type="button"
                  className="home-panel-card fade-up"
                  style={{ "--i": index + 1 }}
                  onClick={() => navigate(`/paineis/${painel.id}`)}
                >
                  <div className="home-panel-card-top">
                    <span className="home-panel-letter" style={{ background: gradientePorTexto(painel.nome) }}>
                      {(painel.nome?.trim()[0] || "P").toUpperCase()}
                    </span>
                    <span className="home-panel-live">
                      <span className="live-dot" />
                      <span>Ao vivo</span>
                    </span>
                  </div>
                  <span className="home-panel-title">{painel.nome}</span>
                  <span className="home-panel-desc">
                    {painel.descricao || "Painel de monitoramento com atualização automática."}
                  </span>
                  <div className="home-panel-meta">
                    <span className="chip"><Layers size={12} />{painel.total_itens} item(ns)</span>
                    <span className="chip"><Timer size={12} />a cada {painel.intervalo_segundos}s</span>
                  </div>
                  <span className="home-panel-cta">
                    Abrir painel
                    <ArrowRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          )}

          {!loading && !paineis.length && (
            <Surface>
              <EmptyState
                icon={LayoutGrid}
                title="Nenhum painel cadastrado ainda"
                description={podeGerenciarPaineis
                  ? "Crie seu primeiro painel ou carregue uma demonstração completa com dados fictícios para explorar a plataforma."
                  : "Assim que um administrador criar painéis, eles aparecerão aqui."}
              >
                {podeGerenciarPaineis && (
                  <>
                    <button type="button" className="btn btn-primary" onClick={() => navigate("/paineis")}>
                      <Plus size={15} />
                      Criar primeiro painel
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={carregarDemo} disabled={carregandoDemo}>
                      <Sparkles size={15} />
                      {carregandoDemo ? "Carregando..." : "Carregar demonstração"}
                    </button>
                  </>
                )}
              </EmptyState>
            </Surface>
          )}
        </section>
      )}

      {podeGerenciarPaineis && !loading && paineis.length > 0 && (
        <div className="home-demo fade-up">
          <div className="home-demo-icon"><Sparkles size={16} /></div>
          <div className="home-demo-text">
            <strong>Dados de demonstração</strong>
            <span>Cria conexão mock, consultas e um painel de exemplo — sem precisar de banco real.</span>
          </div>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={carregarDemo} disabled={carregandoDemo}>
            {carregandoDemo ? "Carregando..." : "Carregar demo"}
          </button>
        </div>
      )}

      {sectionsVisiveis.length > 0 && (
        <section className="mb-2">
          <div className="home-section-header">
            <div>
              <h2 className="home-section-title">Configuração</h2>
              <p className="home-section-subtitle">Cadastre as fontes de dados e gerencie quem acessa o quê.</p>
            </div>
          </div>

          <div className="home-config-grid">
            {sectionsVisiveis.map((section, index) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.key}
                  type="button"
                  className={`home-config-card home-config-card--${section.tone} fade-up`}
                  style={{ "--i": index + 1 }}
                  onClick={() => navigate(section.path)}
                >
                  <span className="home-config-icon"><Icon size={18} /></span>
                  <span className="home-config-text">
                    <span className="home-config-title">{section.title}</span>
                    <span className="home-config-desc">{section.desc}</span>
                  </span>
                  <ArrowRight size={15} className="home-config-arrow" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {semAcesso && (
        <Surface>
          <EmptyState
            icon={ShieldCheck}
            title="Nenhuma tela liberada"
            description="Você ainda não tem telas liberadas. Peça ao administrador para ajustar suas permissões em Usuários."
          />
        </Surface>
      )}
    </div>
  );
}
