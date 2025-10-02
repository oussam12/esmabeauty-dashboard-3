import React, { createContext, useContext, useMemo } from "react";

const SelectCtx = createContext(null);

export function Select({ value, onValueChange, children }) {
  const items = [];
  // Collect items from children
  function collect(node) {
    if (!node) return;
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type && child.type.displayName === "SelectContent") {
        collect(child.props.children);
      } else if (child.type && child.type.displayName === "SelectItem") {
        items.push({ value: child.props.value, label: child.props.children });
      } else if (child.props && child.props.children) {
        collect(child.props.children);
      }
    });
  }
  collect(children);
  const ctx = useMemo(() => ({ value, onValueChange, items }), [value, onValueChange, items.length]);
  return <SelectCtx.Provider value={ctx}>{children}</SelectCtx.Provider>;
}

export function SelectTrigger({ children, ...props }) {
  const ctx = useContext(SelectCtx);
  const current = ctx.items.find((i) => i.value === ctx.value);
  return (
    <div {...props}>
      <select
        value={ctx.value}
        onChange={(e) => ctx.onValueChange && ctx.onValueChange(e.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm"
      >
        {ctx.items.map((i) => (
          <option key={i.value} value={i.value}>{i.label}</option>
        ))}
      </select>
    </div>
  );
}
SelectTrigger.displayName = "SelectTrigger";

export function SelectContent({ children, ...props }) {
  return <div style={{ display: "none" }} {...props}>{children}</div>;
}
SelectContent.displayName = "SelectContent";

export function SelectItem({ children, ...props }) {
  return <div {...props}>{children}</div>;
}
SelectItem.displayName = "SelectItem";

export function SelectValue({ placeholder }) {
  // Not used with our native select; keep for API compatibility
  return <span>{placeholder || ""}</span>;
}
SelectValue.displayName = "SelectValue";
