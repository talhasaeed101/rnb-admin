import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...rest }: TextareaProps) {
  const areaId = id || rest.name;
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <textarea
        id={areaId}
        className={["textarea", className].filter(Boolean).join(" ")}
        {...rest}
      />
    </label>
  );
}
