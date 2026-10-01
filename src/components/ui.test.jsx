import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Database } from "lucide-react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  Alert,
  Avatar,
  Badge,
  DataPreviewTable,
  EmptyState,
  IconButton,
  LoadingState,
  PageHeader,
  Segmented,
  StatCard,
  SubmitButton,
  Surface,
  SwitchField,
} from "./ui";

describe("componentes de UI", () => {
  it("PageHeader mostra título, subtítulo, eyebrow e ações", () => {
    render(<PageHeader icon={Database} eyebrow="Ao vivo" title="Conexões" subtitle="Sub" actions={<button>Ação</button>} />);
    expect(screen.getByRole("heading", { name: "Conexões" })).toBeInTheDocument();
    expect(screen.getByText("Sub")).toBeInTheDocument();
    expect(screen.getByText("Ao vivo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ação" })).toBeInTheDocument();
  });

  it("Surface aplica modificadores e renderiza cabeçalho", () => {
    const { container } = render(
      <Surface title="Lista" subtitle="Itens" icon={Database} actions={<span>3</span>} flush sticky editing className="extra">
        conteúdo
      </Surface>,
    );
    const section = container.querySelector("section");
    expect(section).toHaveClass("surface", "surface--sticky", "surface--editing", "extra");
    expect(container.querySelector(".surface-body--flush")).toHaveTextContent("conteúdo");
    expect(screen.getByText("Itens")).toBeInTheDocument();
  });

  it("Surface sem título não renderiza cabeçalho", () => {
    const { container } = render(<Surface>só corpo</Surface>);
    expect(container.querySelector(".surface-header")).toBeNull();
    expect(container.querySelector(".surface-body")).toHaveTextContent("só corpo");
  });

  it("Alert de erro usa role alert e pode ser fechado", async () => {
    const onClose = vi.fn();
    render(<Alert variant="danger" onClose={onClose} compact>Falhou</Alert>);
    expect(screen.getByRole("alert")).toHaveClass("app-alert--danger", "app-alert--compact");
    await userEvent.click(screen.getByRole("button", { name: "Fechar aviso" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("Alert informativo é anunciado de forma educada", () => {
    render(<Alert variant="desconhecido">Olá</Alert>);
    expect(screen.getByText("Olá").closest(".app-alert")).toHaveAttribute("aria-live", "polite");
  });

  it("EmptyState e LoadingState", () => {
    render(
      <>
        <EmptyState title="Vazio" description="Nada aqui"><button>Criar</button></EmptyState>
        <LoadingState page label="Buscando..." />
      </>,
    );
    expect(screen.getByText("Nada aqui")).toBeInTheDocument();
    expect(screen.getByText("Buscando...").parentElement).toHaveClass("loading-state--page");
  });

  it("Badge com ponto, ícone e fonte mono", () => {
    render(<Badge tone="info" dot icon={Database} mono title="dica">SQL</Badge>);
    const badge = screen.getByText("SQL");
    expect(badge).toHaveClass("badge-soft--info", "badge-mono");
    expect(badge.querySelector(".badge-dot")).not.toBeNull();
  });

  it("IconButton como link, botão e em carregamento", async () => {
    const onClick = vi.fn();
    render(
      <MemoryRouter>
        <IconButton icon={Database} label="Abrir" to="/x" />
        <IconButton icon={Database} label="Testar" tone="success" onClick={onClick} />
        <IconButton icon={Database} label="Carregando" loading />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Abrir" })).toHaveAttribute("href", "/x");
    await userEvent.click(screen.getByRole("button", { name: "Testar" }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Testar" })).toHaveClass("icon-btn--success");
    expect(screen.getByRole("button", { name: "Carregando" })).toBeDisabled();
  });

  it("SubmitButton alterna rótulos", () => {
    const { rerender } = render(<SubmitButton label="Criar" />);
    expect(screen.getByRole("button", { name: "Criar" })).toBeEnabled();
    rerender(<SubmitButton label="Criar" editando />);
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
    rerender(<SubmitButton label="Criar" editando salvando />);
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
  });

  it("Segmented marca a opção ativa e dispara onChange", async () => {
    const onChange = vi.fn();
    render(
      <Segmented
        ariaLabel="Tipo"
        value="a"
        onChange={onChange}
        options={[{ value: "a", label: "A", icon: Database }, { value: "b", label: "B" }]}
      />,
    );
    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("radio", { name: "B" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("SwitchField repassa o valor marcado", async () => {
    const onChange = vi.fn();
    render(<SwitchField id="s" label="Ativo" description="desc" checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch", { name: /Ativo/ }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("StatCard compacto e com dica", () => {
    render(<StatCard icon={Database} label="Painéis" value="Administrador" hint="dica" tone="success" compact />);
    expect(screen.getByText("Administrador")).toHaveClass("stat-card-value--compact");
    expect(screen.getByText("dica")).toBeInTheDocument();
  });

  it("DataPreviewTable monta tabela com linhas repetidas e valores nulos/objetos", () => {
    const linhas = [{ id: 1, extra: { a: 1 } }, { id: 1, extra: { a: 1 } }, { id: 2, nome: null }];
    const { container } = render(<DataPreviewTable linhas={linhas} />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(screen.getByRole("columnheader", { name: "nome" })).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getAllByText('{"a":1}')).toHaveLength(2);
  });

  it("DataPreviewTable cai para JSON quando os dados não são tabulares", () => {
    const { container } = render(<DataPreviewTable linhas={[1, 2]} />);
    expect(container.querySelector("pre.code-block")).toHaveTextContent("1");
  });

  it("Avatar mostra iniciais e tamanho", () => {
    const { container } = render(<><Avatar name="Ana Souza" size="lg" /><Avatar name="Bia" /></>);
    expect(screen.getByText("AS")).toHaveClass("avatar--lg");
    expect(container.querySelectorAll(".avatar")).toHaveLength(2);
  });
});
