import {
  ACHIEVEMENTS,
  Achievement,
  AchievementId,
  DEFAULT_SETTINGS,
  GameSettings,
  SaveData,
} from "./types";

const STORAGE_KEYS = {
  settings: "ud_settings",
  highScores: "ud_high_scores",
  save: "ud_save",
  achievements: "ud_achievements",
  dailySeed: "ud_daily_seed",
  dailyPlayed: "ud_daily_played",
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getSettings(): GameSettings {
  return { ...DEFAULT_SETTINGS, ...readJson<GameSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS) };
}

export function saveSettings(settings: GameSettings) {
  writeJson(STORAGE_KEYS.settings, settings);
}

export function getHighScores(): number[] {
  return readJson<number[]>(STORAGE_KEYS.highScores, []);
}

export function addHighScore(score: number): number[] {
  const scores = getHighScores();
  const next = [...scores, score].sort((a, b) => b - a).slice(0, 10);
  writeJson(STORAGE_KEYS.highScores, next);
  return next;
}

export function getSaveData(): SaveData | null {
  return readJson<SaveData | null>(STORAGE_KEYS.save, null);
}

export function saveRun(data: SaveData) {
  writeJson(STORAGE_KEYS.save, data);
}

export function clearSave() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.save);
}

export function getAchievements(): Achievement[] {
  const unlocked = readJson<Partial<Record<AchievementId, string>>>(
    STORAGE_KEYS.achievements,
    {},
  );

  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    unlockedAt: unlocked[achievement.id],
  }));
}

export function unlockAchievement(id: AchievementId): boolean {
  const unlocked = readJson<Partial<Record<AchievementId, string>>>(
    STORAGE_KEYS.achievements,
    {},
  );
  if (unlocked[id]) return false;
  unlocked[id] = new Date().toISOString();
  writeJson(STORAGE_KEYS.achievements, unlocked);
  return true;
}

export function getDailySeed(date = new Date()): string {
  const key = date.toISOString().slice(0, 10);
  const stored = readJson<Record<string, string>>(STORAGE_KEYS.dailySeed, {});
  if (stored[key]) return stored[key];

  const seed = `${key}-${Math.abs(hashString(key)).toString(36)}`;
  stored[key] = seed;
  writeJson(STORAGE_KEYS.dailySeed, stored);
  return seed;
}

export function markDailyRunPlayed(date = new Date()) {
  const key = date.toISOString().slice(0, 10);
  writeJson(STORAGE_KEYS.dailyPlayed, key);
  unlockAchievement("daily_runner");
}

export function hasPlayedDailyRunToday(date = new Date()): boolean {
  const key = date.toISOString().slice(0, 10);
  return readJson<string | null>(STORAGE_KEYS.dailyPlayed, null) === key;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function evaluateAchievements(state: {
  floor: number;
  score: number;
}): AchievementId[] {
  const unlocked: AchievementId[] = [];
  if (state.floor >= 1 && unlockAchievement("first_floor")) unlocked.push("first_floor");
  if (state.floor >= 5 && unlockAchievement("floor_5")) unlocked.push("floor_5");
  if (state.floor >= 10 && unlockAchievement("floor_10")) unlocked.push("floor_10");
  if (state.floor >= 11 && unlockAchievement("first_boss")) unlocked.push("first_boss");
  if (state.score >= 5000 && unlockAchievement("high_scorer")) unlocked.push("high_scorer");
  return unlocked;
}
