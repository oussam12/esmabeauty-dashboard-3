import React, { createContext, useContext, useState, useMemo } from "react";

const TabsCtx = createContext(null);

export function Tabs({ value, onValueChange, children, className="" }) {
  const [internal, setInternal] = useState(value);
  const v = value ?? internal;
  const setV = (val) => {
    setInternal(val);
    onValueChange && onValueChange(val);
  };
  const ctx = useMemo(() => ({ value: v, setValue: setV }), [v]);
  return <TabsCtx.Provider value={ctx}><div className={className}>{children}</div></TabsCtx.Provider>;
}

export function TabsList({ children, className="" }) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
}

export function TabsTrigger({ value, children }) {
  const { value: v, setValue } = useContext(TabsCtx);
  const active = v === value;
  return (
    <button
      onClick={() => setValue(value)}
      className={`rounded-lg border px-3 py-1 text-sm ${active ? "font-semibold" : ""}`}
      type="button"
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }) {
  const { value: v } = useContext(TabsCtx);
  if (v !== value) return null;
  return <div className="mt-2">{children}</div>;
}
