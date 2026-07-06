export const TILE_SIZE = 16;
export const MAP_SIZE = 25;
export const VIEW_SCALE = 2.5;

export const PLAYER = {
  maxHp: 100,
  maxStamina: 100,
  speed: 100,
  meleeCost: 60,
  meleeMinStamina: 80,
  meleeDamage: 50,
  rangedCost: 15,
  rangedMinStamina: 15,
  rangedDamage: 20,
  projectileSpeed: 120,
  blockMinStamina: 10,
  blockStaminaCost: 10,
  staminaRegenMs: 200,
  meleeCooldownMs: 200,
  rangedCooldownMs: 500,
  blockDurationMs: 500,
} as const;

export const GHOST = {
  hp: 50,
  touchDamage: 5,
  touchChance: 0.25,
  killScore: 200,
  patrolSpeed: 50,
  chaseSpeed: 80,
  dropHealChance: 0.125,
} as const;

export const BOSS_FLOORS = [11, 22, 33] as const;
export const BOSS_ACTIVE = [12, 23, 34] as const;

export const BOSSES = {
  crab: { hp: 1000, touchDamage: 10, floor: 12, name: "Crab King" },
  basilisk: { hp: 2000, touchDamage: 15, floor: 23, name: "Basilisk" },
  dinosaur: { hp: 3000, touchDamage: 20, floor: 34, name: "Dinosaur" },
} as const;

export const TIME_BONUS = {
  normal: 200,
  boss1: 2000,
  boss2: 4000,
  boss3: 8000,
  normalTickMs: 500,
  bossTickMs: 200,
} as const;

export const PICKUP = {
  healAmount: 35,
} as const;

export const TILE = {
  WALL: 0,
  FLOOR: 1,
  CARVED: 2,
  DOOR_OPEN: 3,
  DOOR_CLOSED: 4,
  SPAWN: 5,
} as const;

export const COLORS = {
  wall: 0x1a1030,
  wallEdge: 0x2d1b4e,
  floor: 0x3d2a54,
  carved: 0x4a3568,
  door: 0xd4a017,
  doorClosed: 0x8b4513,
  player: 0x5dade2,
  ghost: 0x9b59b6,
  ghostChase: 0xe74c3c,
  projectile: 0x2ecc71,
  melee: 0xf39c12,
  block: 0x3498db,
  heal: 0xe91e63,
  boss: 0xc0392b,
  hp: 0xe74c3c,
  stamina: 0x2ecc71,
  gold: 0xf1c40f,
} as const;
