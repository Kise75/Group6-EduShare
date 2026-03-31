import { useId } from "react";

function AuthPasswordField({
  label,
  value,
  onChange,
  placeholder = "",
  required = true,
  minLength,
  visible,
  onToggleVisibility,
  showLabel,
  hideLabel,
  autoComplete,
}) {
  const inputId = useId();

  return (
    <div>
      <label className="form-label mb-1" htmlFor={inputId}>
        {label}
      </label>
      <div className="input-action-wrap">
        <input
          id={inputId}
          className="form-control"
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
        />
        <button type="button" className="input-inline-action" onClick={onToggleVisibility}>
          {visible ? hideLabel : showLabel}
        </button>
      </div>
    </div>
  );
}

export default AuthPasswordField;
