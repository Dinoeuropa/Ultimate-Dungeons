export type TileType = 0 | 1 | 2 | 3 | 4 | 5;

export type Direction = "up" | "down" | "left" | "right";

export type CombatAction = "melee" | "ranged" | "block" | null;

export type BossType = "crab" | "basilisk" | "dinosaur" | null;

export type GamePhase = "menu" | "generating" | "playing" | "paused" | "gameover" | "victory";

export interface GridPos {
  x: number;
  y: number;
}

export interface DungeonData {
  tiles: TileType[][];
  width: number;
  height: number;
  spawn: GridPos;
  door: GridPos;
  enemySpawns: GridPos[];
}

export interface GameSnapshot {
  floor: number;
  score: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  timeBonus: number;
  enemyCount: number;
  inGame: boolean;
  bossName: string | null;
  bossHp: number | null;
  bossMaxHp: number | null;
}

export interface ControlState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  melee: boolean;
  ranged: boolean;
  block: boolean;
}

export const EMPTY_CONTROLS: ControlState = {
  up: false,
  down: false,
  left: false,
  right: false,
  melee: false,
  ranged: false,
  block: false,
};
