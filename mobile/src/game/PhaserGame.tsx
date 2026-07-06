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
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const continueFloor = continueRun?.floor ?? 1;
  const continueScore = continueRun?.score ?? 0;
  const continueHp = continueRun?.hp;
  const continueStamina = continueRun?.stamina;
  const hasContinue = !!continueRun;

  useEffect(() => {
    if (!active || !containerRef.current || gameRef.current) return;

    const stableCallbacks: GameCallbacks = {
      onSnapshot: (snapshot) => callbacksRef.current.onSnapshot(snapshot),
      onGameOver: (score) => callbacksRef.current.onGameOver(score),
      onFloorComplete: (floor, score) =>
        callbacksRef.current.onFloorComplete(floor, score),
    };

    gameRef.current = createPhaserGame(containerRef.current, stableCallbacks, {
      floor: continueFloor,
      score: continueScore,
      hp: continueHp,
      stamina: continueStamina,
      dailySeed,
      carryHp: hasContinue,
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
    // Only remount when starting a new session — NOT when HUD/callbacks update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, dailySeed, continueFloor, continueScore, continueHp, continueStamina, hasContinue]);

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
