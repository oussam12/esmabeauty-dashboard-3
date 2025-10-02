"use client";

import dynamic from "next/dynamic";

const AsmabeautyDashboard = dynamic(() => import("@/components/AsmabeautyDashboard"), {
  ssr: false,
});

export default function Page() {
  return <AsmabeautyDashboard />;
}
