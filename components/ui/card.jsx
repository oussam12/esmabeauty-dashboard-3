import React from "react";

export function Card({ className = "", ...props }) {
  return <div className={`rounded-xl border p-4 shadow-sm ${className}`} {...props} />;
}
export function CardHeader({ className = "", ...props }) {
  return <div className={`mb-2 ${className}`} {...props} />;
}
export function CardTitle({ className = "", ...props }) {
  return <h3 className={`text-base font-semibold ${className}`} {...props} />;
}
export function CardContent({ className = "", ...props }) {
  return <div className={`${className}`} {...props} />;
}
