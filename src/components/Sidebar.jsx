import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Database,
  FileCode2,
  Globe,
  History,
  House,
  LayoutGrid,
  LockKeyhole,
  LogOut,
  MonitorPlay,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api } from "../services/api";
import { clearAuth, getAuthUser, hasPermissao } from "../services/authStorage";
import { PERMISSAO_LABEL } from "../utils/painelDisplay";
import { gradientePorTexto } from "../utils/format";
import { Avatar } from "./ui";
import "../styles/Sidebar.css";

function letraPainel(nome) {
  return (nome?.trim()[0] || "P").toUpperCase();
}

function SidebarLink({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink to={to} end={end} className="sidebar-link" title={label}>
      <span className="sidebar-link-icon"><Icon size={16} strokeWidth={1.9} /></span>
      <span className="sidebar-label">{label}</span>
    </NavLink>
  );
}

function SidebarSection({ title }) {
  return (
    <div className="sidebar-section">
      <span className="sidebar-label">{title}</span>
    </div>
  );
}

export function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const usuarioLogado = getAuthUser();
  const [paineis, setPaineis] = useState([]);
  const [carregandoPaineis, setCarregandoPaineis] = useState(true);
  const podeVerPaineis = hasPermissao("ver_paineis");

  const mostrarMonitoramento = podeVerPaineis
    || hasPermissao("gerenciar_paineis")
    || hasPermissao("ver_rotacao")
    || hasPermissao("ver_historico");
  const mostrarAdministracao = hasPermissao("gerenciar_conexoes")
    || hasPermissao("gerenciar_consultas_sql")
    || hasPermissao("gerenciar_consultas_api")
    || hasPermissao("gerenciar_usuarios");

  useEffect(() => {
    if (!podeVerPaineis) return undefined;

    let ativo = true;

    api.get("/paineis/")
      .then((res) => {
        if (!ativo) return;
        setPaineis(res.data.filter((painel) => painel.ativo));
      })
      .catch(() => {
        if (!ativo) return;
        setPaineis([]);
      })
      .finally(() => {
        if (ativo) setCarregandoPaineis(false);
      });

    return () => {
      ativo = false;
    };
  }, [location.pathname, podeVerPaineis]);

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <nav className={`sidebar${collapsed ? " collapsed" : ""}`} aria-label="Menu principal">
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggle}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? <ChevronRight size={13} strokeWidth={2.5} /> : <ChevronLeft size={13} strokeWidth={2.5} />}
      </button>

      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <Activity size={18} strokeWidth={2.4} />
        </div>
        <div className="sidebar-brand-text sidebar-label">
          <span className="sidebar-brand-name">Monitor</span>
          <span className="sidebar-brand-org" title={usuarioLogado?.organizacao?.nome}>
            {usuarioLogado?.organizacao?.nome || "Plataforma de monitoramento"}
          </span>
        </div>
      </div>

      <div className="sidebar-scroll">
        <SidebarSection title="Geral" />
        <SidebarLink to="/home" icon={House} label="Início" />
        <SidebarLink to="/seguranca" icon={LockKeyhole} label="Segurança" />

        {mostrarMonitoramento && <SidebarSection title="Monitoramento" />}

        {hasPermissao("gerenciar_paineis") && (
          <SidebarLink to="/paineis" icon={LayoutGrid} label="Gerenciar painéis" end />
        )}
        {hasPermissao("ver_rotacao") && (
          <SidebarLink to="/rotacao" icon={MonitorPlay} label="Rotação" />
        )}
        {hasPermissao("ver_historico") && (
          <SidebarLink to="/historico" icon={History} label="Histórico" />
        )}

        {podeVerPaineis && (
          <>
            <SidebarSection title="Painéis" />
            {carregandoPaineis && !collapsed && (
              <div className="sidebar-panel-empty">Carregando painéis...</div>
            )}
            {!carregandoPaineis && paineis.map((painel) => (
              <NavLink
                key={painel.id}
                to={`/paineis/${painel.id}`}
                className="sidebar-link sidebar-panel-link"
                title={painel.nome}
              >
                <span
                  className="sidebar-panel-letter"
                  style={{ background: gradientePorTexto(painel.nome) }}
                >
                  {letraPainel(painel.nome)}
                </span>
                <span className="sidebar-label">{painel.nome}</span>
              </NavLink>
            ))}
            {!carregandoPaineis && !paineis.length && !collapsed && (
              <div className="sidebar-panel-empty">Nenhum painel ativo</div>
            )}
          </>
        )}

        {mostrarAdministracao && (
          <>
            <SidebarSection title="Administração" />
            {hasPermissao("gerenciar_conexoes") && (
              <SidebarLink to="/conexoes" icon={Database} label="Conexões" />
            )}
            {hasPermissao("gerenciar_consultas_sql") && (
              <SidebarLink to="/consultas-sql" icon={FileCode2} label="Consultas SQL" />
            )}
            {hasPermissao("gerenciar_consultas_api") && (
              <SidebarLink to="/consultas-api" icon={Globe} label="Consultas API" />
            )}
            {hasPermissao("gerenciar_usuarios") && (
              <>
                <SidebarLink to="/usuarios" icon={Users} label="Usuários" />
                <SidebarLink to="/perfis" icon={ShieldCheck} label="Perfis de acesso" />
              </>
            )}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user" title={usuarioLogado?.email || usuarioLogado?.nome}>
          <div className="sidebar-user-avatar">
            <Avatar name={usuarioLogado?.nome} />
            <span className="sidebar-user-status" />
          </div>
          <div className="sidebar-user-info sidebar-label">
            <span className="sidebar-user-name">{usuarioLogado?.nome || "Usuário"}</span>
            <span className="sidebar-user-role">
              {PERMISSAO_LABEL[usuarioLogado?.tipo_permissao] || usuarioLogado?.email || "Conectado"}
            </span>
          </div>
          <button type="button" className="sidebar-logout" onClick={handleLogout} title="Sair" aria-label="Sair">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
