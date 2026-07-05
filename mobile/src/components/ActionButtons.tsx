"use client";

import { triggerCapacitorHaptic } from "@/lib/game-bridge";

type ActionButtonsProps = {
  visible: boolean;
  onMelee: (pressed: boolean) => void;
  onRanged: (pressed: boolean) => void;
  onBlock: (pressed: boolean) => void;
};

function bindPress(handler: (pressed: boolean) => void) {
  return {
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      handler(true);
      void triggerCapacitorHaptic();
    },
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      handler(false);
    },
    onPointerCancel: () => handler(false),
    onPointerLeave: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        handler(false);
      }
    },
  };
}

export function ActionButtons({
  visible,
  onMelee,
  onRanged,
  onBlock,
}: ActionButtonsProps) {
  if (!visible) return null;

  return (
    <div className="action-buttons" aria-label="Combat controls">
      <button type="button" className="action-btn action-btn--block" {...bindPress(onBlock)}>
        Block
      </button>
      <button type="button" className="action-btn action-btn--ranged" {...bindPress(onRanged)}>
        Ranged
      </button>
      <button type="button" className="action-btn action-btn--melee" {...bindPress(onMelee)}>
        Melee
      </button>
    </div>
  );
}
