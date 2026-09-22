import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className, ...rest }: InputProps) {
  const inputId = id || rest.name;
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <input id={inputId} className={["input", className].filter(Boolean).join(" ")} {...rest} />
      {error ? (
        <span style={{ color: "var(--rnb-danger)", fontSize: 12, marginTop: 4 }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
