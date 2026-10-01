import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  MonitorPlay,
  Pause,
  Play,
  RefreshCw,
  Timer,
} from "lucide-react";
import { PainelGrid, ResumoCriticidade } from "../components/PainelGrid";
import { Alert, EmptyState, LoadingState, Surface } from "../components/ui";
import { api } from "../services/api";
import { gradientePorTexto } from "../utils/format";
import "../styles/Dashboard.css";

const INTERVALO_ROTACAO_PADRAO = 20;

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await document.documentElement.requestFullscreen();
}

export function PainelRotacao() {
  const [paineis, setPaineis] = useState([]);
  const [indice, setIndice] = useState(0);
  const [dados, setDados] = useState(null);
  const [intervaloSegundos, setIntervaloSegundos] = useState(INTERVALO_ROTACAO_PADRAO);
  const [decorrido, setDecorrido] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const decorridoRef = useRef(0);

  const painelAtual = paineis[indice] || null;

  useEffect(() => {
    api.get("/paineis/")
      .then((res) => setPaineis(res.data.filter((p) => p.ativo)))
      .catch(() => setErro("Não foi possível carregar os painéis."))
      .finally(() => setLoading(false));
  }, []);

  const carregarPainel = useCallback(async (painelId) => {
    if (!painelId) return;
    try {
      const res = await api.get(`/paineis/${painelId}/executar/`);
      setDados(res.data);
      setErro("");
    } catch {
      setErro("Falha ao atualizar o painel em rotação.");
    }
  }, []);

  useEffect(() => {
    if (!painelAtual) return undefined;

    let ativo = true;
    api.get(`/paineis/${painelAtual.id}/executar/`)
      .then((res) => {
        if (!ativo) return;
        setDados(res.data);
        setErro("");
      })
      .catch(() => {
        if (ativo) setErro("Falha ao atualizar o painel em rotação.");
      });

    return () => {
      ativo = false;
    };
  }, [painelAtual]);

  useEffect(() => {
    if (!paineis.length || pausado) return undefined;

    const timer = setInterval(() => {
      decorridoRef.current += 1;
      if (decorridoRef.current >= intervaloSegundos) {
        decorridoRef.current = 0;
        setIndice((atual) => (atual + 1) % paineis.length);
      }
      setDecorrido(decorridoRef.current);
    }, 1000);

    return () => clearInterval(timer);
  }, [paineis.length, intervaloSegundos, pausado]);

  useEffect(() => {
    function onFullscreenChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function irPara(novoIndice) {
    decorridoRef.current = 0;
    setDecorrido(0);
    setIndice((novoIndice + paineis.length) % paineis.length);
  }

  if (loading) return <LoadingState label="Carregando rotação..." page />;

  if (!paineis.length) {
    return (
      <div className="page">
        <Surface>
          <EmptyState
            icon={MonitorPlay}
            title="Nenhum painel ativo para rotação"
            description="Ative ao menos um painel para exibi-lo em rotação automática."
          >
            <Link to="/home" className="btn btn-outline-secondary">Voltar ao início</Link>
          </EmptyState>
        </Surface>
      </div>
    );
  }

  const progresso = Math.min(100, (decorrido / intervaloSegundos) * 100);
  const restante = Math.max(0, intervaloSegundos - decorrido);

  return (
    <div className={`page dashboard-page${fullscreen ? " dash-rotacao-fullscreen" : ""}`}>
      <section className="rot-header">
        <div className="rot-header-main">
          <span className="rot-letter" style={{ background: gradientePorTexto(painelAtual?.nome) }}>
            {(painelAtual?.nome?.trim()[0] || "P").toUpperCase()}
          </span>
          <div className="min-w-0">
            <span className="rot-eyebrow">
              <MonitorPlay size={12} />
              Rotação · painel {indice + 1} de {paineis.length}
            </span>
            <h1 className="rot-title">{painelAtual?.nome}</h1>
          </div>
        </div>

        <div className="rot-controls">
          <div className="rot-player">
            <button type="button" className="rot-player-btn" onClick={() => irPara(indice - 1)} title="Painel anterior" aria-label="Painel anterior">
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="rot-player-btn rot-player-btn--main"
              onClick={() => setPausado((atual) => !atual)}
              title={pausado ? "Retomar rotação" : "Pausar rotação"}
              aria-label={pausado ? "Retomar rotação" : "Pausar rotação"}
            >
              {pausado ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button type="button" className="rot-player-btn" onClick={() => irPara(indice + 1)} title="Próximo painel" aria-label="Próximo painel">
              <ChevronRight size={16} />
            </button>
          </div>

          <label className="rot-interval" title="Tempo de exibição de cada painel">
            <Timer size={14} />
            <input
              type="number"
              min={10}
              className="form-control form-control-sm"
              value={intervaloSegundos}
              onChange={(e) => setIntervaloSegundos(Number(e.target.value) || INTERVALO_ROTACAO_PADRAO)}
              aria-label="Intervalo da rotação em segundos"
            />
            <span>s</span>
          </label>

          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => carregarPainel(painelAtual.id)} title="Atualizar dados">
            <RefreshCw size={14} />
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {fullscreen ? "Sair da tela cheia" : "Tela cheia"}
          </button>
        </div>

        <div className="rot-progress">
          <div className="rot-progress-track">
            <span
              className={`rot-progress-fill${decorrido === 0 ? " no-transition" : ""}${pausado ? " is-paused" : ""}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
          <div className="rot-progress-meta">
            <div className="rot-dots">
              {paineis.map((painel, i) => (
                <button
                  key={painel.id}
                  type="button"
                  className={`rot-dot${i === indice ? " is-active" : ""}`}
                  onClick={() => irPara(i)}
                  title={painel.nome}
                  aria-label={`Ir para ${painel.nome}`}
                />
              ))}
            </div>
            <span className="rot-countdown">
              {pausado ? "Pausado" : `Próximo em ${restante}s`}
            </span>
          </div>
        </div>
      </section>

      <ResumoCriticidade itens={dados?.itens || []} />

      {erro && <Alert variant="danger" onClose={() => setErro("")}>{erro}</Alert>}

      <div key={dados?.painel_nome} className="rot-stage">
        <PainelGrid itens={dados?.itens || []} />
      </div>
    </div>
  );
}
