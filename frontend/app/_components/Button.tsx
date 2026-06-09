import type { ButtonHTMLAttributes, ReactNode } from "react";
import React from "react";
import { Tooltip } from 'react-tooltip'
import { useId } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "outline" | "tool";
  fullWidth?: boolean;
  loading?: boolean;
  active?: boolean;
  tooltip?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  fullWidth = false,
  loading = false,
  className = "",
  active = false,
  tooltip,
  ...props
}) => {
  const baseClasses = variant != "tool" ?
    "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition disabled:opacity-50 cursor-pointer" : "";

  const variantClasses: Record<string, string> = {
    primary: "bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-400",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400",
    outline: "border border-gray-300 text-gray-800 hover:bg-gray-100 focus:ring-gray-400",
    tool: "font-inter inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border px-[10px] leading-none",
  };

  const tooltipId = `tooltip-${useId()}`;
  return (
    <>
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className} ${variant == 'tool' && active ? "bg-gray-700 border-gray-700 text-white" : "border-[#e5e7eb] bg-[#f8fafc] text-[#0f172a] hover:bg-gray-200"}`}
        {...props}
        data-tooltip-id={tooltipId} data-tooltip-content={tooltip}
      >
        {loading ? "Processing..." : children}
      </button>
      {tooltip && (
        <Tooltip id={tooltipId} />
      )}
    </>
  );
};

export default Button;
