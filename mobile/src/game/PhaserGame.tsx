"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { ControlState } from "@/game/types";
import {
  createPhaserGame,
  GameCallbacks,
  getDungeonScene,
} from "@/game/scenes/DungeonScene";

type PhaserGameProps = {
  active: boolean;
  paused: boolean;
  controls: ControlState;
  callbacks: GameCallbacks;
  dailySeed?: number;
  continueRun?: {
    floor: number;
    score: number;
    hp: number;
    stamina: number;
  } | null;
};

export function PhaserGame({
  active,
  paused,
  controls,
  callbacks,
  dailySeed,
  continueRun,
}: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current || gameRef.current) return;

    gameRef.current = createPhaserGame(containerRef.current, callbacks, {
      floor: continueRun?.floor ?? 1,
      score: continueRun?.score ?? 0,
      hp: continueRun?.hp,
      stamina: continueRun?.stamina,
      dailySeed,
      carryHp: !!continueRun,
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [active, callbacks, continueRun, dailySeed]);

  useEffect(() => {
    const scene = gameRef.current ? getDungeonScene(gameRef.current) : null;
    scene?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    const scene = gameRef.current ? getDungeonScene(gameRef.current) : null;
    scene?.setControls(controls);
  }, [controls]);

  if (!active) return null;

  return <div ref={containerRef} className="phaser-root" />;
}
