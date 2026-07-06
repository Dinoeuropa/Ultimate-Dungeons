"use client";

import dynamic from "next/dynamic";

const GameApp = dynamic(
  () => import("@/components/GameApp").then((mod) => mod.GameApp),
  {
    ssr: false,
    loading: () => (
      <div className="splash-screen">
        <div className="splash-screen__content">
          <p className="splash-screen__eyebrow">Loading</p>
          <h1>Ultimate Dungeons</h1>
          <p>Preparing the dungeon engine…</p>
        </div>
      </div>
    ),
  },
);

export function GameLoader() {
  return <GameApp />;
}
