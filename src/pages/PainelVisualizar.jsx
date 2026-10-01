import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { History, LayoutDashboard, ListPlus, RefreshCw } from "lucide-react";
import { PainelGrid, ResumoCriticidade } from "../components/PainelGrid";
import { Alert, LoadingState, PageHeader } from "../components/ui";
import { api } from "../services/api";
import { hasPermissao } from "../services/authStorage";
import "../styles/Dashboard.css";

export function PainelVisualizar() {
  const { id } = useParams();
  const podeGerenciar = hasPermissao("gerenciar_paineis");
  const podeVerHistorico = hasPermissao("ver_historico");
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const carregar = useCallback(async (silencioso = false) => {
    if (silencioso) setAtualizando(true);
    else setLoading(true);
    try {
      const res = await api.get(`/paineis/${id}/executar/`);
      setDados(res.data);
      setUltimaAtualizacao(new Date());
      setErro("");
    } catch {
      setErro("Não foi possível carregar o painel.");
    } finally {
      if (silencioso) setAtualizando(false);
      else setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!dados?.intervalo_segundos) return undefined;

    const intervalId = setInterval(() => {
      carregar(true);
    }, dados.intervalo_segundos * 1000);

    return () => clearInterval(intervalId);
  }, [dados?.intervalo_segundos, carregar]);

  if (loading && !dados) {
    return <LoadingState label="Carregando painel..." page />;
  }

  const intervalo = dados?.intervalo_segundos || 60;

  return (
    <div className="page dashboard-page">
      <PageHeader
        icon={LayoutDashboard}
        eyebrow={(
          <span className="dash-live">
            <span className="live-dot" />
            Ao vivo · atualiza a cada {intervalo}s
          </span>
        )}
        title={dados?.painel_nome || "Painel"}
        subtitle={ultimaAtualizacao ? `Última atualização às ${ultimaAtualizacao.toLocaleTimeString("pt-BR")}` : undefined}
        actions={(
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => carregar(true)} disabled={atualizando}>
              <RefreshCw size={14} className={atualizando ? "spin" : ""} />
              {atualizando ? "Atualizando..." : "Atualizar"}
            </button>
            {podeVerHistorico && (
              <Link to="/historico" className="btn btn-outline-secondary btn-sm">
                <History size={14} />
                Histórico
              </Link>
            )}
            {podeGerenciar && (
              <Link to={`/paineis/${id}/editar`} className="btn btn-outline-secondary btn-sm">
                <ListPlus size={14} />
                Editar itens
              </Link>
            )}
          </>
        )}
      />

      <div className="dash-refresh-bar" aria-hidden="true">
        <span key={ultimaAtualizacao?.getTime()} style={{ animationDuration: `${intervalo}s` }} />
      </div>

      <ResumoCriticidade itens={dados?.itens || []} />

      {erro && <Alert variant="danger" onClose={() => setErro("")}>{erro}</Alert>}

      <PainelGrid itens={dados?.itens || []} />
    </div>
  );
}
