import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

export function PermissoesGrupoSelector({
  catalogo,
  selecionadas,
  onChange,
  idPrefix = "perm",
}) {
  const [busca, setBusca] = useState("");
  const grupos = catalogo?.grupos || [];

  const termo = busca.trim().toLowerCase();

  const gruposFiltrados = useMemo(() => {
    if (!termo) return grupos;

    return grupos
      .map((grupo) => ({
        ...grupo,
        permissoes: grupo.permissoes.filter((item) =>
          item.nome.toLowerCase().includes(termo)
          || item.codename.toLowerCase().includes(termo)
        ),
      }))
      .filter((grupo) => grupo.permissoes.length > 0);
  }, [grupos, termo]);

  function alternar(codename) {
    const possui = selecionadas.includes(codename);
    onChange(
      possui
        ? selecionadas.filter((item) => item !== codename)
        : [...selecionadas, codename]
    );
  }

  function alternarGrupo(grupo, marcar) {
    const codenames = grupo.permissoes.map((item) => item.codename);
    if (marcar) {
      onChange([...new Set([...selecionadas, ...codenames])]);
      return;
    }
    onChange(selecionadas.filter((item) => !codenames.includes(item)));
  }

  const totalDisponiveis = grupos.reduce((acc, grupo) => acc + grupo.permissoes.length, 0);

  return (
    <div className="perm-selector">
      <div className="perm-toolbar">
        <div className="input-icon flex-grow-1">
          <Search size={14} />
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder="Buscar permissão..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <span className="perm-counter">
          <strong>{selecionadas.length}</strong>/{totalDisponiveis}
        </span>
      </div>

      <div className="perm-groups">
        {gruposFiltrados.map((grupo) => {
          const codenamesGrupo = grupo.permissoes.map((item) => item.codename);
          const selecionadasGrupo = codenamesGrupo.filter((item) => selecionadas.includes(item));
          const todasMarcadas = codenamesGrupo.length > 0
            && selecionadasGrupo.length === codenamesGrupo.length;

          return (
            <div className="perm-group" key={grupo.id}>
              <div className="perm-group-header">
                <div className="perm-group-title">
                  <strong>{grupo.nome}</strong>
                  <span className="count-pill">{selecionadasGrupo.length}/{codenamesGrupo.length}</span>
                </div>
                {codenamesGrupo.length > 0 && (
                  <button
                    type="button"
                    className="perm-group-toggle"
                    onClick={() => alternarGrupo(grupo, !todasMarcadas)}
                  >
                    {todasMarcadas ? "Desmarcar todas" : "Marcar todas"}
                  </button>
                )}
              </div>

              {grupo.permissoes.length > 0 ? (
                <div className="perm-items">
                  {grupo.permissoes.map((item) => {
                    const marcada = selecionadas.includes(item.codename);
                    const inputId = `${idPrefix}-${item.codename}`;
                    return (
                      <label className={`perm-item${marcada ? " is-checked" : ""}`} htmlFor={inputId} key={item.codename}>
                        <input
                          id={inputId}
                          type="checkbox"
                          className="perm-item-input"
                          checked={marcada}
                          onChange={() => alternar(item.codename)}
                        />
                        <span className="perm-item-check"><Check size={12} strokeWidth={3} /></span>
                        <span className="perm-item-label">{item.nome}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted small mb-0">Nenhuma permissão neste grupo.</p>
              )}
            </div>
          );
        })}

        {!gruposFiltrados.length && (
          <p className="text-muted small mb-0 text-center py-3">Nenhuma permissão encontrada para a busca.</p>
        )}
      </div>
    </div>
  );
}
