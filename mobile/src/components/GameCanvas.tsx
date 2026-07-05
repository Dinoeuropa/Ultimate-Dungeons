"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ControlButton,
  lockLandscape,
  postToGameFrame,
  triggerCapacitorHaptic,
} from "@/lib/game-bridge";
import { GameStatePayload } from "@/lib/types";
import { ActionButtons } from "./ActionButtons";
import { PauseMenu } from "./PauseMenu";
import { VirtualDpad } from "./VirtualDpad";

type GameCanvasProps = {
  active: boolean;
  paused: boolean;
  onReady: () => void;
  onStateChange: (state: GameStatePayload) => void;
  onResume: () => void;
  onQuit: () => void;
  difficultyValue: number;
};

export function GameCanvas({
  active,
  paused,
  onReady,
  onStateChange,
  onResume,
  onQuit,
  difficultyValue,
}: GameCanvasProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(12);

  useEffect(() => {
    if (!active) return;
    lockLandscape();
  }, [active]);

  useEffect(() => {
    if (!active || !loading) return;

    const interval = window.setInterval(() => {
      setLoadProgress((value) => Math.min(value + 8, 92));
    }, 250);

    return () => window.clearInterval(interval);
  }, [active, loading]);

  useEffect(() => {
    if (!active) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "game-ready" || data.type === "game-shell-ready") {
        setLoading(false);
        setLoadProgress(100);
        onReady();
        postToGameFrame(frameRef.current, {
          type: "game-command",
          command: "setDifficulty",
          value: difficultyValue,
        });
      }

      if (data.type === "game-state" && data.payload?.action === "state") {
        onStateChange(data.payload as GameStatePayload);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [active, difficultyValue, onReady, onStateChange]);

  useEffect(() => {
    if (!active) return;
    postToGameFrame(frameRef.current, {
      type: "game-command",
      command: paused ? "pause" : "resume",
    });
  }, [active, paused]);

  const sendControl = useCallback(
    (button: ControlButton, pressed: boolean) => {
      if (paused || loading) return;
      postToGameFrame(frameRef.current, {
        type: "game-control",
        button,
        pressed,
      });
      if (pressed) {
        void triggerCapacitorHaptic();
      }
    },
    [loading, paused],
  );

  if (!active) return null;

  return (
    <div className="game-shell">
      {loading && (
        <div className="game-loader">
          <div className="game-loader__title">Ultimate Dungeons</div>
          <div className="game-loader__bar">
            <span style={{ width: `${loadProgress}%` }} />
          </div>
          <p>Loading dungeon engine…</p>
        </div>
      )}

      <iframe
        ref={frameRef}
        src="/game/index.html"
        title="Ultimate Dungeons"
        className="game-frame"
        allow="fullscreen"
      />

      <VirtualDpad
        visible={!loading && !paused}
        onDirection={sendControl}
      />

      <ActionButtons
        visible={!loading && !paused}
        onMelee={(pressed) => sendControl("a", pressed)}
        onRanged={(pressed) => sendControl("b", pressed)}
        onBlock={(pressed) => sendControl("block", pressed)}
      />

      {paused && (
        <PauseMenu
          onResume={onResume}
          onRestart={() =>
            postToGameFrame(frameRef.current, {
              type: "game-command",
              command: "restart",
            })
          }
          onQuit={onQuit}
        />
      )}
    </div>
  );
}
