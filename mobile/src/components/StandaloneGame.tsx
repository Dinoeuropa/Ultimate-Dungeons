"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PhaserGame } from "@/game/PhaserGame";
import { GameCallbacks } from "@/game/scenes/DungeonScene";
import { ControlButton, triggerCapacitorHaptic } from "@/lib/game-bridge";
import { ControlState, EMPTY_CONTROLS, GameSnapshot } from "@/game/types";
import { ActionButtons } from "./ActionButtons";
import { PauseMenu } from "./PauseMenu";
import { VirtualDpad } from "./VirtualDpad";

type StandaloneGameProps = {
  active: boolean;
  paused: boolean;
  dailySeed?: number;
  continueRun?: {
    floor: number;
    score: number;
    hp: number;
    stamina: number;
  } | null;
  onReady: () => void;
  onStateChange: (state: GameSnapshot) => void;
  onGameOver: (score: number) => void;
  onResume: () => void;
  onQuit: () => void;
};

export function StandaloneGame({
  active,
  paused,
  dailySeed,
  continueRun,
  onReady,
  onStateChange,
  onGameOver,
  onResume,
  onQuit,
}: StandaloneGameProps) {
  const [controls, setControls] = useState<ControlState>(EMPTY_CONTROLS);
  const readyRef = useRef(false);

  const onReadyRef = useRef(onReady);
  const onStateChangeRef = useRef(onStateChange);
  const onGameOverRef = useRef(onGameOver);
  onReadyRef.current = onReady;
  onStateChangeRef.current = onStateChange;
  onGameOverRef.current = onGameOver;

  const callbacks = useMemo<GameCallbacks>(
    () => ({
      onSnapshot: (snapshot) => {
        if (!readyRef.current && snapshot.inGame) {
          readyRef.current = true;
          onReadyRef.current();
        }
        onStateChangeRef.current(snapshot);
      },
      onGameOver: (score) => onGameOverRef.current(score),
      onFloorComplete: () => undefined,
    }),
    [],
  );

  const setDirection = useCallback((button: ControlButton, pressed: boolean) => {
    if (paused) return;
    setControls((prev) => ({
      ...prev,
      [button]: pressed,
    }));
    if (pressed) void triggerCapacitorHaptic();
  }, [paused]);

  const setAction = useCallback((key: "melee" | "ranged" | "block", pressed: boolean) => {
    if (paused) return;
    setControls((prev) => ({ ...prev, [key]: pressed }));
    if (pressed) void triggerCapacitorHaptic();
  }, [paused]);

  useEffect(() => {
    if (!active) {
      readyRef.current = false;
      setControls(EMPTY_CONTROLS);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="game-shell game-shell--standalone">
      <PhaserGame
        active={active}
        paused={paused}
        controls={controls}
        callbacks={callbacks}
        dailySeed={dailySeed}
        continueRun={continueRun}
      />

      <VirtualDpad visible={!paused} onDirection={setDirection} />

      <ActionButtons
        visible={!paused}
        onMelee={(pressed) => setAction("melee", pressed)}
        onRanged={(pressed) => setAction("ranged", pressed)}
        onBlock={(pressed) => setAction("block", pressed)}
      />

      {paused && (
        <PauseMenu
          onResume={onResume}
          onRestart={onQuit}
          onQuit={onQuit}
        />
      )}
    </div>
  );
}
