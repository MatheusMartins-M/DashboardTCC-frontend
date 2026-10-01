import { useState, useSyncExternalStore } from "react";
import { Sidebar } from "../components/Sidebar";

const TELA_PEQUENA = "(max-width: 767px)";

function assinarTelaPequena(callback) {
  const media = window.matchMedia(TELA_PEQUENA);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function useTelaPequena() {
  return useSyncExternalStore(assinarTelaPequena, () => window.matchMedia(TELA_PEQUENA).matches);
}

export function MainLayout({ children }) {
  const telaPequena = useTelaPequena();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const recolhido = sidebarCollapsed || telaPequena;

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  return (
    <div className="app-shell">
      <Sidebar collapsed={recolhido} onToggle={toggleSidebar} />
      <main className={`content${recolhido ? " content-collapsed" : ""}`}>
        <div className="content-inner">{children}</div>
      </main>
    </div>
  );
}
