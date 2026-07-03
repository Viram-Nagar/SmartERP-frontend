import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className = "",
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <Label className="text-zinc-300 text-sm">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-zinc-600 text-xs">{hint}</p>}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

export function FormRow({ children, cols = 2 }) {
  return <div className={`grid grid-cols-${cols} gap-3`}>{children}</div>;
}

export function FormSection({ title, children }) {
  return (
    <div className="space-y-4 border-t border-zinc-800 pt-4 mt-4">
      {title && (
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  ...props
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 px-3 py-2 text-sm ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
