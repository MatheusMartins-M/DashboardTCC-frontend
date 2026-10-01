import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp, TriangleAlert } from "lucide-react";
import "../styles/ConfirmModal.css";

const ConfirmDialogContext = createContext(null);

const DEFAULTS = {
  title: "Confirmar ação",
  message: "Deseja continuar?",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
  variant: "danger",
};

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => cancelRef.current?.focus(), 0);

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const perigoso = variant === "danger";
  const Icone = perigoso ? TriangleAlert : CircleHelp;

  return createPortal(
    <div className="confirm-modal-root">
      <button
        type="button"
        className="confirm-modal-backdrop"
        onClick={onCancel}
        aria-label="Fechar confirmação"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        className="confirm-modal-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className="confirm-modal-body">
          <div className={`confirm-modal-icon${perigoso ? " is-danger" : ""}`}>
            <Icone size={20} />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="confirm-modal-title">{title}</h2>
            <p id={descId} className="confirm-modal-message">{message}</p>
          </div>
        </div>
        <div className="confirm-modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-${perigoso ? "danger" : "primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialogProvider({ children }) {
  const [state, setState] = useState({ open: false, ...DEFAULTS });
  const resolveRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        open: true,
        ...DEFAULTS,
        ...options,
      });
    });
  }, []);

  const close = useCallback((result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setState((current) => ({ ...current, open: false }));
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <ConfirmModal
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        variant={state.variant}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirm deve ser usado dentro de ConfirmDialogProvider.");
  }
  return context.confirm;
}
