import React from "react";
export function Badge({ children, className="", variant="default", ...props }) {
  const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs";
  return <span className={`${base} ${className}`} {...props}>{children}</span>;
}
