import { Activity, BellRing, CircleCheck, Database, Globe, MonitorPlay } from "lucide-react";

const RECURSOS = [
  { icon: Database, texto: "Conexões SQL Server, MySQL e mock" },
  { icon: Globe, texto: "Monitoramento de endpoints HTTP" },
  { icon: BellRing, texto: "Alertas por criticidade em tempo real" },
  { icon: MonitorPlay, texto: "Rotação automática para TVs e NOC" },
];

const BARRAS = [38, 62, 45, 80, 56, 92, 70, 84, 60, 96, 74, 88];

function PreviewDashboard() {
  return (
    <div className="auth-preview" aria-hidden="true">
      <div className="auth-preview-kpis">
        <div className="auth-preview-kpi">
          <span className="auth-preview-kpi-label">Pedidos pendentes</span>
          <span className="auth-preview-kpi-value">128</span>
          <span className="auth-preview-pill auth-preview-pill--ok">Normal</span>
        </div>
        <div className="auth-preview-kpi">
          <span className="auth-preview-kpi-label">Fila de integração</span>
          <span className="auth-preview-kpi-value">42</span>
          <span className="auth-preview-pill auth-preview-pill--warn">Atenção</span>
        </div>
        <div className="auth-preview-kpi">
          <span className="auth-preview-kpi-label">API de pagamentos</span>
          <span className="auth-preview-kpi-value">OK</span>
          <span className="auth-preview-pill auth-preview-pill--ok">200</span>
        </div>
      </div>
      <div className="auth-preview-chart">
        {BARRAS.map((altura, index) => (
          <span key={index} style={{ height: `${altura}%`, animationDelay: `${index * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}

export function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-form-side">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <Activity size={18} strokeWidth={2.4} />
          </div>
          <span className="auth-brand-name">Monitor</span>
        </div>

        <div className="auth-form-center">
          <div className="auth-card">{children}</div>
        </div>

        <p className="auth-footer">© {new Date().getFullYear()} Monitor · Plataforma de monitoramento</p>
      </div>

      <aside className="auth-hero-side">
        <div className="auth-hero-grid" />
        <div className="auth-hero-glow auth-hero-glow--1" />
        <div className="auth-hero-glow auth-hero-glow--2" />

        <div className="auth-hero-content">
          <span className="auth-hero-eyebrow">
            <span className="live-dot" />
            <span>Monitoramento em tempo real</span>
          </span>
          <h1 className="auth-hero-title">Todos os seus indicadores em um só painel.</h1>
          <p className="auth-hero-subtitle">
            Configure conexões, consultas SQL e APIs, defina regras de criticidade e acompanhe tudo ao vivo.
          </p>

          <PreviewDashboard />

          <ul className="auth-hero-features">
            {RECURSOS.map(({ icon: Icon, texto }) => (
              <li key={texto}>
                <span className="auth-hero-feature-icon"><Icon size={14} /></span>
                {texto}
              </li>
            ))}
          </ul>

          <p className="auth-hero-trust">
            <CircleCheck size={14} />
            Multiempresa, com perfis de acesso por tela
          </p>
        </div>
      </aside>
    </div>
  );
}
