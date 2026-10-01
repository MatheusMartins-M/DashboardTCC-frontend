import { useEffect, useState } from "react";
import { Activity, CircleX, Gauge, History, LayoutGrid, RefreshCw, TriangleAlert } from "lucide-react";
import { CriticidadeBadge } from "../components/PainelGrid";
import { Alert, CountPill, EmptyState, LoadingState, PageHeader, StatCard, Surface } from "../components/ui";
import { api } from "../services/api";
import { gradientePorTexto } from "../utils/format";
import "../styles/Admin.css";
import "../styles/Dashboard.css";

function formatarData(valor) {
  const data = new Date(valor);
  return {
    dia: data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
    hora: data.toLocaleTimeString("pt-BR"),
  };
}

export function Historico() {
  const [paineis, setPaineis] = useState([]);
  const [itens, setItens] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [filtros, setFiltros] = useState({ painel: "", apenas_alertas: false });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarHistorico(nextFiltros = filtros) {
    setLoading(true);
    setErro("");
    try {
      const params = {};
      if (nextFiltros.painel) params.painel = nextFiltros.painel;
      if (nextFiltros.apenas_alertas) params.apenas_alertas = "1";

      const [resHistorico, resResumo] = await Promise.all([
        api.get("/historico/", { params }),
        api.get("/historico/resumo/", { params }),
      ]);
      setItens(resHistorico.data);
      setResumo(resResumo.data);
    } catch {
      setErro("Não foi possível carregar o histórico.");
      setItens([]);
      setResumo(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get("/paineis/").then((res) => setPaineis(res.data)).catch(() => setPaineis([]));
    carregarHistorico();
  }, []);

  function alterarFiltros(parcial) {
    const proximos = { ...filtros, ...parcial };
    setFiltros(proximos);
    carregarHistorico(proximos);
  }

  const taxaAlertas = resumo?.total_registros
    ? Math.round((resumo.total_alertas / resumo.total_registros) * 100)
    : 0;

  return (
    <div className="page">
      <PageHeader
        icon={History}
        title="Histórico e alertas"
        subtitle="Registro das execuções dos painéis — gerado a cada atualização automática."
        actions={(
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => carregarHistorico()} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Atualizar
          </button>
        )}
      />

      {erro && <Alert variant="danger" onClose={() => setErro("")}>{erro}</Alert>}

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3 fade-up" style={{ "--i": 1 }}>
          <StatCard icon={Activity} tone="primary" label="Registros" value={resumo?.total_registros ?? "—"} hint="Execuções no filtro atual" />
        </div>
        <div className="col-sm-6 col-xl-3 fade-up" style={{ "--i": 2 }}>
          <StatCard icon={TriangleAlert} tone="warning" label="Alertas" value={resumo?.total_alertas ?? "—"} hint="Atenção, Crítico ou Erro" />
        </div>
        <div className="col-sm-6 col-xl-3 fade-up" style={{ "--i": 3 }}>
          <StatCard icon={CircleX} tone="danger" label="Erros" value={resumo?.total_erros ?? "—"} hint="Falhas de execução" />
        </div>
        <div className="col-sm-6 col-xl-3 fade-up" style={{ "--i": 4 }}>
          <StatCard icon={Gauge} tone="info" label="Taxa de alertas" value={resumo ? `${taxaAlertas}%` : "—"} hint="Alertas sobre o total" />
        </div>
      </div>

      <Surface
        flush
        icon={History}
        title="Últimas execuções"
        subtitle="Mais recentes primeiro"
        actions={<CountPill>{itens.length}</CountPill>}
      >
        <div className="hist-filters">
          <div className="input-icon hist-filter-painel">
            <LayoutGrid size={14} />
            <select
              id="historico-painel"
              className="form-select form-select-sm"
              aria-label="Filtrar por painel"
              value={filtros.painel}
              onChange={(e) => alterarFiltros({ painel: e.target.value })}
            >
              <option value="">Todos os painéis</option>
              {paineis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="apenas-alertas"
              checked={filtros.apenas_alertas}
              onChange={(e) => alterarFiltros({ apenas_alertas: e.target.checked })}
            />
            <label className="form-check-label" htmlFor="apenas-alertas">Somente alertas</label>
          </div>
        </div>

        {loading && <LoadingState label="Carregando histórico..." />}
        {!loading && !itens.length && (
          <EmptyState
            icon={History}
            title="Nenhum registro encontrado"
            description={filtros.apenas_alertas || filtros.painel
              ? "Nenhuma execução corresponde aos filtros selecionados."
              : "Abra um painel para gerar histórico — cada atualização é registrada aqui."}
          />
        )}
        {!loading && itens.length > 0 && (
          <div className="table-scroll table-scroll--tall">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Painel</th>
                  <th>Item</th>
                  <th>Valor</th>
                  <th>Criticidade</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => {
                  const quando = formatarData(item.executado_em);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="cell-title tabular-nums">{quando.hora}</div>
                        <div className="cell-sub">{quando.dia}</div>
                      </td>
                      <td>
                        <div className="cell-main">
                          <span className="panel-letter panel-letter--sm" style={{ background: gradientePorTexto(item.painel_nome) }}>
                            {(item.painel_nome?.trim()[0] || "P").toUpperCase()}
                          </span>
                          <span className="cell-truncate">{item.painel_nome}</span>
                        </div>
                      </td>
                      <td className="cell-title">{item.item_titulo}</td>
                      <td className="cell-mono">{item.valor ?? "—"}</td>
                      <td>
                        <CriticidadeBadge nivel={item.criticidade_nivel || "neutro"} rotulo={item.criticidade_rotulo} />
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
  );
}
