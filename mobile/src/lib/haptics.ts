export async function triggerHaptic(enabled: boolean, pattern: number | number[] = 12) {
  if (!enabled || typeof navigator === "undefined") return;

  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
    return;
  } catch {
    // fall through to navigator.vibrate
  }

  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
