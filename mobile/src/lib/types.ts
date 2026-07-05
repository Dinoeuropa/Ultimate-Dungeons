export type Difficulty = "easy" | "normal" | "hard";

export type GameSettings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  difficulty: Difficulty;
  showTutorialOnStart: boolean;
};

export type SaveData = {
  floor: number;
  score: number;
  hp: number;
  stamina: number;
  savedAt: string;
  dailySeed: string;
};

export type AchievementId =
  | "first_floor"
  | "floor_5"
  | "floor_10"
  | "first_boss"
  | "high_scorer"
  | "daily_runner";

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  unlockedAt?: string;
};

export type GameStatePayload = {
  action: "state";
  floor: number;
  score: number;
  highScore: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  inGame: boolean;
  paused: boolean;
  difficulty: number;
};

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  difficulty: "normal",
  showTutorialOnStart: true,
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_floor",
    title: "First Steps",
    description: "Clear your first dungeon floor.",
  },
  {
    id: "floor_5",
    title: "Delver",
    description: "Reach floor 5.",
  },
  {
    id: "floor_10",
    title: "Deep Explorer",
    description: "Reach floor 10.",
  },
  {
    id: "first_boss",
    title: "Boss Slayer",
    description: "Defeat your first boss.",
  },
  {
    id: "high_scorer",
    title: "Treasure Hunter",
    description: "Score 5,000 points in a run.",
  },
  {
    id: "daily_runner",
    title: "Daily Delver",
    description: "Play a daily run.",
  },
];

export function difficultyToValue(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy":
      return 0;
    case "hard":
      return 2;
    default:
      return 1;
  }
}
