import React from "react";
export function Separator({ className="", ...props }) {
  return <hr className={`my-2 ${className}`} {...props} />;
}
