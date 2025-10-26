// components/ui/stubs.tsx
import React, { PropsWithChildren } from "react";
const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

/* ---------- helpers ---------- */
type BaseProps = PropsWithChildren<{ className?: string }>;

/* ---------- Card ---------- */
export function Card({ className, children, ...rest }: BaseProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl shadow-sm border border-gray-200",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
export function CardHeader({ className, children, ...rest }: BaseProps) {
  return (
    <div className={clsx("px-4 py-3 border-b border-gray-100", className)} {...rest}>
      {children}
    </div>
  );
}
export function CardContent({ className, children, ...rest }: BaseProps) {
  return (
    <div className={clsx("px-4 py-4", className)} {...rest}>
      {children}
    </div>
  );
}
export function CardTitle({ className, children, ...rest }: BaseProps) {
  return (
    <h3 className={clsx("text-lg font-semibold", className)} {...rest}>
      {children}
    </h3>
  );
}

/* ---------- Button ---------- */
type ButtonProps = BaseProps & {
  variant?: "default" | "outline" | "destructive" | "secondary";
  size?: "sm" | "md";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};
export function Button({
  variant = "default",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const v =
    variant === "outline"
      ? "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
      : variant === "destructive"
      ? "bg-red-600 text-white hover:bg-red-700"
      : variant === "secondary"
      ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
      : "bg-black text-white hover:bg-gray-800";
  const s = size === "sm" ? "px-2.5 py-1.5 text-sm rounded-lg" : "px-3.5 py-2 rounded-xl";
  return (
    <button className={clsx(v, s, "transition", className)} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Inputs ---------- */
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };
export function Input({ className, ...rest }: InputProps) {
  return (
    <input
      className={clsx(
        "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300",
        className
      )}
      {...rest}
    />
  );
}

export function Label({ className, children, ...rest }: BaseProps) {
  return (
    <label className={clsx("mb-1 block text-sm font-medium text-gray-700", className)} {...rest}>
      {children}
    </label>
  );
}

/* ---------- Select (very small stub) ---------- */
type SelectProps = BaseProps & {
  value?: string;
  onChange?: (v: string) => void;
};
export function Select({ value, onChange, children, className, ...rest }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={clsx(
        "w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-gray-300",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

type OptionProps = React.OptionHTMLAttributes<HTMLOptionElement> & { className?: string };
export function Option({ className, children, ...rest }: OptionProps) {
  return (
    <option className={className} {...rest}>
      {children}
    </option>
  );
}

/* ---------- Table ---------- */
export function Table({ className, children, ...rest }: BaseProps) {
  return (
    <div className={clsx("overflow-x-auto", className)} {...rest}>
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}
export function Thead({ className, children, ...rest }: BaseProps) {
  return (
    <thead className={className} {...rest}>
      {children}
    </thead>
  );
}
export function Tbody({ className, children, ...rest }: BaseProps) {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
}
export function Tr({ className, children, ...rest }: BaseProps) {
  return (
    <tr className={clsx("border-b last:border-0", className)} {...rest}>
      {children}
    </tr>
  );
}
export function Th({ className, children, ...rest }: BaseProps) {
  return (
    <th className={clsx("text-left px-3 py-2 font-semibold text-gray-700", className)} {...rest}>
      {children}
    </th>
  );
}
export function Td({ className, children, ...rest }: BaseProps) {
  return (
    <td className={clsx("px-3 py-2 align-top", className)} {...rest}>
      {children}
    </td>
  );
}

/* ---------- Badge ---------- */
type BadgeProps = BaseProps & { variant?: "default" | "secondary" | "destructive" };
export function Badge({ variant = "default", className, children, ...rest }: BadgeProps) {
  const v =
    variant === "destructive"
      ? "bg-red-600 text-white"
      : variant === "secondary"
      ? "bg-gray-200 text-gray-900"
      : "bg-gray-900 text-white";
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs", v, className)} {...rest}>
      {children}
    </span>
  );
}

/* ---------- Alert ---------- */
export function Alert({ className, children, ...rest }: BaseProps) {
  return (
    <div className={clsx("rounded-xl border border-amber-300 bg-amber-50 p-3", className)} {...rest}>
      {children}
    </div>
  );
}
export function AlertDescription({ className, children, ...rest }: BaseProps) {
  return (
    <div className={clsx("text-sm text-amber-900", className)} {...rest}>
      {children}
    </div>
  );
}

/* ---------- Dialog (super-minimal) ---------- */
type DialogProps = BaseProps & {
  open: boolean;
  onOpenChange?: (o: boolean) => void;
};
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange?.(false)}
    >
      <div
        className="max-w-lg w-full rounded-xl bg-white p-4 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
export function DialogHeader({ className, children, ...rest }: BaseProps) {
  return (
    <div className={clsx("mb-2", className)} {...rest}>
      {children}
    </div>
  );
}
export function DialogTitle({ className, children, ...rest }: BaseProps) {
  return (
    <h4 className={clsx("text-lg font-semibold", className)} {...rest}>
      {children}
    </h4>
  );
}
