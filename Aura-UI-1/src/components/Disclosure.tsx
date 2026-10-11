import { ReactNode } from "react";

export default function Disclosure({
  label,
  hint,
  open,
  onToggle,
  children,
}: {
  label: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className={`disclosure ${open ? "open" : ""}`}>
      <button type="button" className="disclosure-btn" aria-expanded={open} onClick={onToggle}>
        <span>{label}</span>
        {hint ? <em>{hint}</em> : <em />}
        <i>{open ? "Hide" : "Show"}</i>
      </button>
      {open ? <div className="disclosure-body">{children}</div> : null}
    </div>
  );
}
