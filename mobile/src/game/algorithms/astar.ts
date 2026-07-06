import { GridPos, TileType } from "../types";
import { TILE } from "../constants";

function walkable(tiles: TileType[][], x: number, y: number): boolean {
  if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) return false;
  const tile = tiles[y][x];
  return tile === TILE.FLOOR || tile === TILE.CARVED || tile === TILE.DOOR_OPEN || tile === TILE.SPAWN;
}

function heuristic(a: GridPos, b: GridPos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function findPath(
  tiles: TileType[][],
  start: GridPos,
  goal: GridPos,
): GridPos[] {
  const open: GridPos[] = [start];
  const cameFrom = new Map<string, GridPos>();
  const gScore = new Map<string, number>();
  const key = (p: GridPos) => `${p.x},${p.y}`;

  gScore.set(key(start), 0);

  while (open.length > 0) {
    open.sort(
      (a, b) =>
        (gScore.get(key(a)) ?? Infinity) + heuristic(a, goal) -
        ((gScore.get(key(b)) ?? Infinity) + heuristic(b, goal)),
    );
    const current = open.shift()!;
    if (current.x === goal.x && current.y === goal.y) {
      const path: GridPos[] = [];
      let node: GridPos | undefined = current;
      while (node) {
        path.unshift(node);
        node = cameFrom.get(key(node));
      }
      return path;
    }

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    for (const next of neighbors) {
      if (!walkable(tiles, next.x, next.y)) continue;
      const tentative = (gScore.get(key(current)) ?? Infinity) + 1;
      if (tentative < (gScore.get(key(next)) ?? Infinity)) {
        cameFrom.set(key(next), current);
        gScore.set(key(next), tentative);
        if (!open.some((p) => p.x === next.x && p.y === next.y)) {
          open.push(next);
        }
      }
    }
  }

  return [];
}
