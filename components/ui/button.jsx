import React from "react";

export function Button({ children, variant = "default", size="default", className="", ...props }) {
  const base = "inline-flex items-center gap-2 rounded-lg px-3 py-2 border text-sm";
  const variants = {
    default: "border-gray-300",
    outline: "border-gray-300 bg-white",
    ghost: "border-transparent bg-transparent",
  };
  const sizes = { icon: "p-2", default: "" };
  return (
    <button className={`${base} ${variants[variant]||""} ${sizes[size]||""} ${className}`} {...props}>
      {children}
    </button>
  );
}
