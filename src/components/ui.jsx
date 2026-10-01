import { Link } from "react-router-dom";
import {
  CircleAlert,
  CircleCheck,
  Inbox,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from "lucide-react";
import { gradientePorTexto, iniciais } from "../utils/format";

export function PageHeader({ icon: Icon, eyebrow, title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        {Icon && (
          <div className="page-header-icon">
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Surface({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  flush = false,
  sticky = false,
  editing = false,
  className = "",
}) {
  const classes = [
    "surface",
    sticky && "surface--sticky",
    editing && "surface--editing",
    className,
  ].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      {(title || actions) && (
        <div className="surface-header">
          <div className="surface-header-main">
            {Icon && (
              <div className="surface-header-icon">
                <Icon size={16} />
              </div>
            )}
            <div className="min-w-0">
              {title && <h2 className="surface-title">{title}</h2>}
              {subtitle && <p className="surface-subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? "surface-body--flush" : "surface-body"}>{children}</div>
    </section>
  );
}

const ALERT_ICONS = {
  success: CircleCheck,
  danger: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

export function Alert({ variant = "info", children, onClose, compact = false, className = "" }) {
  const Icon = ALERT_ICONS[variant] || Info;
  const erro = variant === "danger";
  const classes = ["app-alert", `app-alert--${variant}`, compact && "app-alert--compact", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={classes}
      role={erro ? "alert" : undefined}
      aria-live={erro ? "assertive" : "polite"}
    >
      <Icon size={16} className="app-alert-icon" />
      <div className="app-alert-content">{children}</div>
      {onClose && (
        <button type="button" className="app-alert-close" onClick={onClose} aria-label="Fechar aviso">
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={20} />
      </div>
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
      {children && <div className="empty-state-actions">{children}</div>}
    </div>
  );
}

export function LoadingState({ label = "Carregando...", page = false }) {
  return (
    <div className={`loading-state${page ? " loading-state--page" : ""}`}>
      <LoaderCircle size={18} className="spin" />
      <span>{label}</span>
    </div>
  );
}

export function Badge({ tone = "neutral", dot = false, icon: Icon, mono = false, children, title }) {
  return (
    <span className={`badge-soft badge-soft--${tone}${mono ? " badge-mono" : ""}`} title={title}>
      {dot && <span className="badge-dot" />}
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {children}
    </span>
  );
}

export function StatusBadge({ ativo, ativoLabel = "Ativo", inativoLabel = "Inativo" }) {
  return (
    <Badge tone={ativo ? "success" : "neutral"} dot>
      {ativo ? ativoLabel : inativoLabel}
    </Badge>
  );
}

export function CountPill({ children }) {
  return <span className="count-pill">{children}</span>;
}

export function IconButton({ icon: Icon, label, tone = "default", to, onClick, disabled = false, loading = false }) {
  const className = tone === "default" ? "icon-btn" : `icon-btn icon-btn--${tone}`;
  const content = loading ? <LoaderCircle size={15} className="spin" /> : <Icon size={15} />;

  if (to) {
    return (
      <Link to={to} className={className} title={label} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      title={label}
      aria-label={label}
    >
      {content}
    </button>
  );
}

export function SubmitButton({ salvando, editando, label, labelEditando = "Salvar alterações" }) {
  let texto = editando ? labelEditando : label;
  if (salvando) texto = "Salvando...";
  return (
    <button type="submit" className="btn btn-primary" disabled={salvando}>
      {salvando && <LoaderCircle size={15} className="spin" />}
      {texto}
    </button>
  );
}

export function Segmented({ value, onChange, options, ariaLabel }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const ativo = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={ativo}
            className={`segmented-option${ativo ? " is-active" : ""}`}
            onClick={() => onChange(optionValue)}
          >
            {Icon && <Icon size={14} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function SwitchField({ id, checked, onChange, label, description }) {
  return (
    <div className="switch-row">
      <label className="switch-row-text" htmlFor={id}>
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </label>
      <div className="form-check form-switch">
        <input
          id={id}
          className="form-check-input"
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = "primary", compact = false }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card-icon">
        <Icon size={18} />
      </div>
      <div className="stat-card-body">
        <p className="stat-card-label">{label}</p>
        <p className={`stat-card-value${compact ? " stat-card-value--compact" : ""}`} title={String(value)}>{value}</p>
        {hint && <p className="stat-card-hint">{hint}</p>}
      </div>
    </div>
  );
}

function comChavePorConteudo(linhas) {
  const ocorrencias = new Map();
  return linhas.map((linha) => {
    const base = JSON.stringify(linha);
    const repeticao = ocorrencias.get(base) ?? 0;
    ocorrencias.set(base, repeticao + 1);
    return { linha, chave: repeticao ? `${base}#${repeticao}` : base };
  });
}

function formatarCelula(valor) {
  if (valor == null) return "—";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

export function DataPreviewTable({ linhas = [], max = 100 }) {
  const amostra = linhas.slice(0, max);
  const tabular = amostra.length > 0
    && amostra.every((linha) => linha && typeof linha === "object" && !Array.isArray(linha));

  if (!tabular) {
    return <pre className="code-block">{JSON.stringify(linhas, null, 2)}</pre>;
  }

  const colunas = [...new Set(amostra.flatMap((linha) => Object.keys(linha)))];
  const linhasComChave = comChavePorConteudo(amostra);

  return (
    <div className="mini-table-wrap">
      <table className="mini-table">
        <thead>
          <tr>{colunas.map((coluna) => <th key={coluna}>{coluna}</th>)}</tr>
        </thead>
        <tbody>
          {linhasComChave.map(({ linha, chave }) => (
            <tr key={chave}>
              {colunas.map((coluna) => <td key={coluna}>{formatarCelula(linha[coluna])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Avatar({ name, size }) {
  return (
    <span
      className={size ? `avatar avatar--${size}` : "avatar"}
      style={{ "--avatar-bg": gradientePorTexto(name) }}
      aria-hidden="true"
    >
      {iniciais(name)}
    </span>
  );
}
