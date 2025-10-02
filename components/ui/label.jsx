import React from "react";
export function Label({ className="", ...props }) {
  return <label className={`mb-1 block text-sm font-medium ${className}`} {...props} />;
}
