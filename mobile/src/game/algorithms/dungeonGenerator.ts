import { MAP_SIZE, TILE } from "../constants";
import { DungeonData, GridPos, TileType } from "../types";
import { findPath } from "./astar";

function createGrid(fill: TileType): TileType[][] {
  return Array.from({ length: MAP_SIZE }, () =>
    Array.from({ length: MAP_SIZE }, () => fill),
  );
}

function carveBorder(tiles: TileType[][]) {
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (x === 0 || y === 0 || x === MAP_SIZE - 1 || y === MAP_SIZE - 1) {
        tiles[y][x] = TILE.WALL;
      } else {
        tiles[y][x] = TILE.WALL;
      }
    }
  }
}

function scatterFloor(tiles: TileType[][], count: number) {
  let placed = 0;
  while (placed < count) {
    const x = 1 + Math.floor(Math.random() * (MAP_SIZE - 2));
    const y = 1 + Math.floor(Math.random() * (MAP_SIZE - 2));
    if (tiles[y][x] === TILE.WALL) {
      tiles[y][x] = TILE.FLOOR;
      placed++;
    }
  }
}

function placeDoor(tiles: TileType[][]): GridPos {
  const choice = 1 + Math.floor(Math.random() * 3);
  let door: GridPos;
  if (choice === 1) {
    door = { x: 18 + Math.floor(Math.random() * 6), y: 5 + Math.floor(Math.random() * 11) };
  } else if (choice === 2) {
    door = { x: 1 + Math.floor(Math.random() * 23), y: 1 + Math.floor(Math.random() * 5) };
  } else {
    door = { x: 1 + Math.floor(Math.random() * 10), y: 5 + Math.floor(Math.random() * 11) };
  }
  // Never place door on player spawn column/row.
  if (Math.abs(door.x - 12) < 2 && Math.abs(door.y - 22) < 2) {
    door = { x: 20, y: 5 };
  }
  tiles[door.y][door.x] = TILE.DOOR_CLOSED;
  return door;
}

function carveAlongPath(tiles: TileType[][], path: GridPos[]) {
  for (const pos of path) {
    tiles[pos.y][pos.x] = TILE.CARVED;
    for (const [dx, dy] of [
      [0, 0],
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      if (ny > 0 && ny < MAP_SIZE - 1 && nx > 0 && nx < MAP_SIZE - 1) {
        if (tiles[ny][nx] === TILE.FLOOR || tiles[ny][nx] === TILE.WALL) {
          tiles[ny][nx] = TILE.CARVED;
        }
      }
    }
  }
}

function waypointOrder(choice: number): number[] {
  if (choice === 1) return [0, 1, 2, 3, 4, 5, 6];
  if (choice === 2) return [1, 0, 3, 2, 5, 4, 6];
  return [5, 3, 2, 1, 4, 0, 6];
}

export function generateDungeon(seed?: number): DungeonData {
  if (seed != null) {
    let s = seed;
    Math.random = () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  const tiles = createGrid(TILE.WALL);
  carveBorder(tiles);
  scatterFloor(tiles, 450);

  const waypoints: GridPos[] = [
    { x: 5, y: 3 + Math.floor(Math.random() * 18) },
    { x: 10, y: 3 + Math.floor(Math.random() * 18) },
    { x: 15, y: 3 + Math.floor(Math.random() * 18) },
    { x: 20, y: 3 + Math.floor(Math.random() * 18) },
    { x: 23, y: 3 + Math.floor(Math.random() * 18) },
    { x: 12, y: 12 },
    { x: 12, y: 20 },
  ];

  const spawn: GridPos = { x: 12, y: 22 };
  tiles[spawn.y][spawn.x] = TILE.SPAWN;

  const door = placeDoor(tiles);
  waypoints[6] = door;

  const choice = 1 + Math.floor(Math.random() * 3);
  const order = waypointOrder(choice);
  let cursor = spawn;

  for (let i = 0; i < order.length; i++) {
    const target = i === 0 ? spawn : waypoints[order[i]];
    const path = findPath(tiles, cursor, target);
    carveAlongPath(tiles, path);
    cursor = target;
  }

  const pathToDoor = findPath(tiles, cursor, door);
  carveAlongPath(tiles, pathToDoor);

  for (let y = 1; y < MAP_SIZE - 1; y++) {
    for (let x = 1; x < MAP_SIZE - 1; x++) {
      if (tiles[y][x] === TILE.FLOOR) {
        tiles[y][x] = TILE.CARVED;
      }
    }
  }

  const ghostCount = 2 + Math.floor(Math.random() * 3);
  const enemySpawns: GridPos[] = [];
  const used = new Set<string>();

  for (let i = 0; i < ghostCount; i++) {
    let attempts = 0;
    while (attempts < 80) {
      const x = 3 + Math.floor(Math.random() * (MAP_SIZE - 6));
      const y = 3 + Math.floor(Math.random() * (MAP_SIZE - 6));
      const key = `${x},${y}`;
      if (tiles[y][x] !== TILE.CARVED || used.has(key)) {
        attempts++;
        continue;
      }
      const tooCloseToSpawn =
        Math.abs(spawn.x - x) + Math.abs(spawn.y - y) < 6;
      const tooCloseToDoor =
        Math.abs(door.x - x) + Math.abs(door.y - y) < 4;
      const tooCloseToOther = enemySpawns.some(
        (s) => Math.abs(s.x - x) + Math.abs(s.y - y) < 4,
      );
      if (!tooCloseToSpawn && !tooCloseToDoor && !tooCloseToOther) {
        enemySpawns.push({ x, y });
        used.add(key);
        break;
      }
      attempts++;
    }
  }

  // Guarantee at least two enemies on carved tiles.
  if (enemySpawns.length < 2) {
    for (let y = 1; y < MAP_SIZE - 1; y++) {
      for (let x = 1; x < MAP_SIZE - 1; x++) {
        if (enemySpawns.length >= 2) break;
        const key = `${x},${y}`;
        if (tiles[y][x] === TILE.CARVED && !used.has(key)) {
          enemySpawns.push({ x, y });
          used.add(key);
        }
      }
    }
  }

  return {
    tiles,
    width: MAP_SIZE,
    height: MAP_SIZE,
    spawn,
    door,
    enemySpawns,
  };
}

export function generateBossArena(type: "crab" | "basilisk" | "dinosaur"): DungeonData {
  const size = 15;
  const tiles = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => TILE.WALL as TileType),
  );

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      tiles[y][x] = TILE.CARVED;
    }
  }

  if (type === "dinosaur") {
    for (let i = 0; i < 8; i++) {
      const x = 3 + Math.floor(Math.random() * 9);
      const y = 3 + Math.floor(Math.random() * 9);
      tiles[y][x] = TILE.WALL;
    }
  }

  const spawn = { x: 2, y: size - 3 };
  const door = { x: size - 3, y: 2 };
  tiles[spawn.y][spawn.x] = TILE.SPAWN;
  tiles[door.y][door.x] = TILE.DOOR_CLOSED;

  return {
    tiles,
    width: size,
    height: size,
    spawn,
    door,
    enemySpawns: [{ x: Math.floor(size / 2), y: Math.floor(size / 2) }],
  };
}
