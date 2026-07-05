"use client";

import { ControlButton, triggerCapacitorHaptic } from "@/lib/game-bridge";

type VirtualDpadProps = {
  visible: boolean;
  onDirection: (direction: ControlButton, pressed: boolean) => void;
};

const BUTTONS: Array<{ id: ControlButton; label: string; className: string }> = [
  { id: "left", label: "◀", className: "dpad-btn dpad-btn--left" },
  { id: "up", label: "▲", className: "dpad-btn dpad-btn--up" },
  { id: "down", label: "▼", className: "dpad-btn dpad-btn--down" },
  { id: "right", label: "▶", className: "dpad-btn dpad-btn--right" },
];

export function VirtualDpad({ visible, onDirection }: VirtualDpadProps) {
  if (!visible) return null;

  const bind = (button: ControlButton) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      onDirection(button, true);
      void triggerCapacitorHaptic();
    },
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onDirection(button, false);
    },
    onPointerCancel: () => onDirection(button, false),
    onPointerLeave: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        onDirection(button, false);
      }
    },
  });

  return (
    <div className="virtual-dpad" aria-label="Movement controls">
      {BUTTONS.map((button) => (
        <button
          key={button.id}
          type="button"
          className={button.className}
          aria-label={button.id}
          {...bind(button.id)}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
