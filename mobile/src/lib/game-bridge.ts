export type ControlButton =
  | "up"
  | "down"
  | "left"
  | "right"
  | "a"
  | "b"
  | "block";

export type GameBridgeMessage =
  | { type: "game-control"; button: ControlButton; pressed: boolean }
  | { type: "game-command"; command: string; value?: number };

export function postToGameFrame(
  frame: HTMLIFrameElement | null,
  message: GameBridgeMessage,
) {
  if (!frame?.contentWindow) return;
  frame.contentWindow.postMessage(message, "*");
}

export function triggerHaptic(pattern: number | number[] = 12) {
  if (typeof navigator === "undefined") return;
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export async function triggerCapacitorHaptic() {
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    triggerHaptic(10);
  }
}

export async function lockLandscape() {
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    await orientation.lock?.("landscape");
  } catch {
    // unsupported browsers ignore orientation lock
  }
}
