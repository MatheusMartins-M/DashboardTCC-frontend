import { CircleAlert, CircleCheck, CircleHelp, CircleX, FileCode2, Globe, LayoutGrid, TriangleAlert } from "lucide-react";
import { formatarValorItem, resolverCriticidadeItem, resumirCriticidade } from "../utils/painelDisplay";
import { DataPreviewTable, EmptyState } from "./ui";
import "../styles/Dashboard.css";

const ICONE_NIVEL = {
  normal: CircleCheck,
  atencao: TriangleAlert,
  critico: CircleX,
  erro: CircleAlert,
  neutro: CircleHelp,
};

const ROTULO_NIVEL = {
  normal: "Normal",
  atencao: "Atenção",
  critico: "Crítico",
  erro: "Erro",
  neutro: "Indefinido",
};

export function CriticidadeBadge({ nivel = "neutro", rotulo }) {
  const Icon = ICONE_NIVEL[nivel] || CircleHelp;
  return (
    <span className={`crit-badge crit-badge--${nivel}`}>
      <Icon size={12} strokeWidth={2.5} />
      <span>{rotulo || ROTULO_NIVEL[nivel] || "—"}</span>
    </span>
  );
}

export function ResumoCriticidade({ itens = [] }) {
  const resumo = resumirCriticidade(itens);
  const niveis = ["normal", "atencao", "critico", "erro"];

  return (
    <div className="crit-summary">
      <span className="crit-summary-total">
        <LayoutGrid size={13} />
        <strong>{itens.length}</strong> itens
      </span>
      {niveis.map((nivel) => {
        const Icon = ICONE_NIVEL[nivel];
        return (
          <span key={nivel} className={`crit-summary-item crit-summary-item--${nivel}${resumo[nivel] ? " has-value" : ""}`}>
            <Icon size={13} />
            <strong>{resumo[nivel]}</strong>
            {ROTULO_NIVEL[nivel]}
          </span>
        );
      })}
    </div>
  );
}

export function PainelGrid({ itens = [] }) {
  if (!itens.length) {
    return (
      <div className="surface">
        <EmptyState
          icon={LayoutGrid}
          title="Nenhum item neste painel"
          description="Adicione cards com consultas SQL ou API na tela de itens do painel."
        />
      </div>
    );
  }

  return (
    <div className="kpi-grid">
      {itens.map((item, index) => {
        const criticidade = resolverCriticidadeItem(item);
        const nivel = criticidade.nivel || "neutro";
        const cor = criticidade.cor || item.cor || "#64748b";
        const linhas = item.formato === "tabela" ? item.dados?.linhas || [] : [];

        return (
          <article
            key={item.item_id}
            className={`kpi-card kpi-card--${nivel}${nivel === "critico" ? " kpi-card--pulse" : ""}${linhas.length ? " kpi-card--wide" : ""}`}
            style={{ "--kpi-accent": cor, "--i": index }}
          >
            <header className="kpi-card-header">
              <h3 className="kpi-card-title" title={item.titulo}>{item.titulo}</h3>
              <span className="kpi-card-source" title={item.tipo === "api" ? "Consulta API" : "Consulta SQL"}>
                {item.tipo === "api" ? <Globe size={12} /> : <FileCode2 size={12} />}
              </span>
            </header>

            <div className="kpi-card-value">{formatarValorItem(item)}</div>

            <footer className="kpi-card-footer">
              <CriticidadeBadge nivel={nivel} rotulo={criticidade.rotulo} />
              {item.formato === "tabela" && !item.erro && (
                <span className="kpi-card-hint">linha(s)</span>
              )}
            </footer>

            {item.erro && <p className="kpi-card-error" title={item.erro}>{item.erro}</p>}

            {linhas.length > 0 && (
              <div className="kpi-card-table">
                <DataPreviewTable linhas={linhas} max={3} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
