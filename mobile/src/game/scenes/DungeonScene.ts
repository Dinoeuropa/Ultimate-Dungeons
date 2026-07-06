import Phaser from "phaser";
import {
  BOSSES,
  COLORS,
  GHOST,
  MAP_SIZE,
  PICKUP,
  PLAYER,
  TILE,
  TILE_SIZE,
  TIME_BONUS,
  VIEW_SCALE,
} from "../constants";
import { generateBossArena, generateDungeon } from "../algorithms/dungeonGenerator";
import { findPath } from "../algorithms/astar";
import {
  BossType,
  ControlState,
  Direction,
  DungeonData,
  GameSnapshot,
  GridPos,
  TileType,
} from "../types";

type EnemyObj = {
  container: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Arc;
  body: Phaser.GameObjects.Arc;
  hp: number;
  maxHp: number;
  id: number;
  chasing: boolean;
  patrolDir: number;
  isBoss: boolean;
  bossType: BossType;
};

type ProjectileObj = {
  sprite: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  damage: number;
  fromPlayer: boolean;
  life: number;
};

export type GameCallbacks = {
  onSnapshot: (snapshot: GameSnapshot) => void;
  onGameOver: (score: number) => void;
  onFloorComplete: (floor: number, score: number) => void;
};

export class DungeonScene extends Phaser.Scene {
  static pendingConfig: {
    callbacks: GameCallbacks;
    floor?: number;
    score?: number;
    hp?: number;
    stamina?: number;
    dailySeed?: number;
    carryHp?: boolean;
  } | null = null;

  private callbacks: GameCallbacks = {
    onSnapshot: () => undefined,
    onGameOver: () => undefined,
    onFloorComplete: () => undefined,
  };

  private controls: ControlState = {
    up: false,
    down: false,
    left: false,
    right: false,
    melee: false,
    ranged: false,
    block: false,
  };

  private dungeon!: DungeonData;
  private tileSprites: Phaser.GameObjects.Rectangle[][] = [];
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Arc;
  private playerGlow!: Phaser.GameObjects.Arc;
  private shield!: Phaser.GameObjects.Arc;
  private enemies: EnemyObj[] = [];
  private projectiles: ProjectileObj[] = [];
  private pickups: Phaser.GameObjects.Arc[] = [];

  private floor = 1;
  private score = 0;
  private hp: number = PLAYER.maxHp;
  private stamina: number = PLAYER.maxStamina;
  private timeBonus: number = TIME_BONUS.normal;
  private enemyCount = 0;
  private blocking = false;
  private blockTimer = 0;
  private meleeCooldown = 0;
  private rangedCooldown = 0;
  private staminaRegenTimer = 0;
  private timeBonusTimer = 0;
  private invulnTimer = 0;
  private facing: Direction = "down";
  private paused = false;
  private generating = true;
  private genProgress = 0;
  private bossType: BossType = null;
  private dailySeed?: number;
  private carryHp = true;

  private fxLayer!: Phaser.GameObjects.Container;
  private worldLayer!: Phaser.GameObjects.Container;
  private nextEnemyId = 1;
  private snapshotTimer = 0;

  constructor() {
    super("DungeonScene");
  }

  init(data: {
    callbacks?: GameCallbacks;
    floor?: number;
    score?: number;
    hp?: number;
    stamina?: number;
    dailySeed?: number;
    carryHp?: boolean;
  }) {
    const pending = DungeonScene.pendingConfig;
    const merged = { ...pending, ...data };
    if (merged.callbacks) this.callbacks = merged.callbacks;
    this.floor = merged.floor ?? 1;
    this.score = merged.score ?? 0;
    this.hp = merged.hp ?? PLAYER.maxHp;
    this.stamina = merged.stamina ?? PLAYER.maxStamina;
    this.dailySeed = merged.dailySeed;
    this.carryHp = merged.carryHp ?? true;
    if (!this.carryHp) this.hp = PLAYER.maxHp;
    DungeonScene.pendingConfig = null;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0b0612);
    this.worldLayer = this.add.container(0, 0);
    this.fxLayer = this.add.container(0, 0);

    this.shield = this.add.circle(0, 0, 14, COLORS.block, 0.35);
    this.shield.setStrokeStyle(2, COLORS.block, 0.9);
    this.shield.setVisible(false);
    this.fxLayer.add(this.shield);

    this.startFloor();
    this.scale.on("resize", this.centerWorld, this);
    this.centerWorld();
  }

  setControls(controls: ControlState) {
    this.controls = controls;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  private centerWorld() {
    const mapW = this.dungeon?.width ?? MAP_SIZE;
    const mapH = this.dungeon?.height ?? MAP_SIZE;
    const worldW = mapW * TILE_SIZE * VIEW_SCALE;
    const worldH = mapH * TILE_SIZE * VIEW_SCALE;
    const offsetX = Math.max(0, (this.scale.width - worldW) / 2);
    const offsetY = Math.max(0, (this.scale.height - worldH) / 2);
    this.worldLayer.setPosition(offsetX, offsetY);
    this.fxLayer.setPosition(offsetX, offsetY);
    this.worldLayer.setScale(VIEW_SCALE);
    this.fxLayer.setScale(VIEW_SCALE);
  }

  private startFloor() {
    this.clearWorld();
    this.bossType = this.getBossType();
    this.generating = true;
    this.genProgress = 0;

    if (this.bossType) {
      this.dungeon = generateBossArena(this.bossType);
      this.timeBonus =
        this.bossType === "crab"
          ? TIME_BONUS.boss1
          : this.bossType === "basilisk"
            ? TIME_BONUS.boss2
            : TIME_BONUS.boss3;
    } else {
      const seed = this.dailySeed != null ? this.dailySeed + this.floor : undefined;
      this.dungeon = generateDungeon(seed);
      this.timeBonus = TIME_BONUS.normal;
    }

    this.renderTiles();
    this.createPlayer();
    this.spawnEnemies();
    this.generating = false;
    this.emitSnapshot();
  }

  private getBossType(): BossType {
    if (this.floor === BOSSES.crab.floor) return "crab";
    if (this.floor === BOSSES.basilisk.floor) return "basilisk";
    if (this.floor === BOSSES.dinosaur.floor) return "dinosaur";
    return null;
  }

  private clearWorld() {
    this.tileSprites = [];
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.worldLayer.removeAll(true);
    this.fxLayer.removeAll(true);
    this.shield = this.add.circle(0, 0, 14, COLORS.block, 0.35);
    this.shield.setStrokeStyle(2, COLORS.block, 0.9);
    this.shield.setVisible(false);
    this.fxLayer.add(this.shield);
  }

  private renderTiles() {
    const { tiles, width, height } = this.dungeon;
    this.tileSprites = [];

    for (let y = 0; y < height; y++) {
      const row: Phaser.GameObjects.Rectangle[] = [];
      for (let x = 0; x < width; x++) {
        const tile = tiles[y][x];
        const color = this.tileColor(tile);
        const rect = this.add.rectangle(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          TILE_SIZE - 1,
          TILE_SIZE - 1,
          color,
        );
        if (tile === TILE.DOOR_CLOSED || tile === TILE.DOOR_OPEN) {
          rect.setStrokeStyle(1, COLORS.door);
        }
        this.worldLayer.add(rect);
        row.push(rect);
      }
      this.tileSprites.push(row);
    }
  }

  private tileColor(tile: TileType): number {
    switch (tile) {
      case TILE.WALL:
        return COLORS.wall;
      case TILE.FLOOR:
        return COLORS.floor;
      case TILE.CARVED:
        return COLORS.carved;
      case TILE.DOOR_OPEN:
        return COLORS.door;
      case TILE.DOOR_CLOSED:
        return COLORS.doorClosed;
      case TILE.SPAWN:
        return COLORS.carved;
      default:
        return COLORS.wall;
    }
  }

  private setTile(x: number, y: number, tile: TileType) {
    if (!this.dungeon.tiles[y]?.[x]) return;
    this.dungeon.tiles[y][x] = tile;
    const sprite = this.tileSprites[y]?.[x];
    if (sprite) {
      sprite.setFillStyle(this.tileColor(tile));
      if (tile === TILE.DOOR_OPEN || tile === TILE.DOOR_CLOSED) {
        sprite.setStrokeStyle(1, COLORS.door);
      } else {
        sprite.setStrokeStyle(0);
      }
    }
  }

  private createPlayer() {
    const { spawn } = this.dungeon;
    const px = spawn.x * TILE_SIZE + TILE_SIZE / 2;
    const py = spawn.y * TILE_SIZE + TILE_SIZE / 2;

    this.playerGlow = this.add.circle(0, 0, 10, COLORS.player, 0.35);
    this.playerBody = this.add.circle(0, 0, 8, COLORS.player);
    this.playerBody.setStrokeStyle(2, 0xffffff, 0.9);
    const visor = this.add.rectangle(0, -2, 7, 4, 0xffffff, 1);

    this.player = this.add.container(px, py, [this.playerGlow, this.playerBody, visor]);
    this.player.setDepth(10);
    this.worldLayer.add(this.player);
  }

  private spawnEnemies() {
    if (this.bossType) {
      const bossDef = BOSSES[this.bossType];
      const pos = this.dungeon.enemySpawns[0];
      const enemy = this.createEnemy(
        pos.x * TILE_SIZE + TILE_SIZE / 2,
        pos.y * TILE_SIZE + TILE_SIZE / 2,
        bossDef.hp,
        true,
        this.bossType,
        COLORS.boss,
        12,
      );
      this.enemies.push(enemy);
      this.enemyCount = 1;
      return;
    }

    this.enemyCount = this.dungeon.enemySpawns.length;
    for (const pos of this.dungeon.enemySpawns) {
      this.enemies.push(
        this.createEnemy(
          pos.x * TILE_SIZE + TILE_SIZE / 2,
          pos.y * TILE_SIZE + TILE_SIZE / 2,
          GHOST.hp,
          false,
          null,
          COLORS.ghost,
          7,
        ),
      );
    }
  }

  private createEnemy(
    x: number,
    y: number,
    hp: number,
    isBoss: boolean,
    bossType: BossType,
    color: number,
    radius: number,
  ): EnemyObj {
    const glow = this.add.circle(0, 0, radius + 3, color, 0.2);
    const body = this.add.circle(0, 0, radius, color);
    body.setStrokeStyle(2, 0xffffff, 0.35);
    const container = this.add.container(x, y, [glow, body]);
    container.setDepth(8);
    this.worldLayer.add(container);

    return {
      container,
      glow,
      body,
      hp,
      maxHp: hp,
      id: this.nextEnemyId++,
      chasing: false,
      patrolDir: Math.random() > 0.5 ? 1 : -1,
      isBoss,
      bossType,
    };
  }

  update(_time: number, delta: number) {
    if (this.paused || this.generating) return;

    this.updateTimers(delta);
    this.updatePlayer(delta);
    this.updateEnemies(delta);
    this.updateProjectiles(delta);
    this.collectPickups();
    this.checkDoor();
    this.snapshotTimer += delta;
    if (this.snapshotTimer >= 200) {
      this.snapshotTimer = 0;
      this.emitSnapshot();
    }
  }

  private updateTimers(delta: number) {
    if (this.meleeCooldown > 0) this.meleeCooldown -= delta;
    if (this.rangedCooldown > 0) this.rangedCooldown -= delta;
    if (this.invulnTimer > 0) this.invulnTimer -= delta;
    if (this.blockTimer > 0) {
      this.blockTimer -= delta;
      if (this.blockTimer <= 0) {
        this.blocking = false;
        this.shield.setVisible(false);
      }
    }

    if (this.stamina < PLAYER.maxStamina) {
      this.staminaRegenTimer += delta;
      if (this.staminaRegenTimer >= PLAYER.staminaRegenMs) {
        this.stamina = Math.min(PLAYER.maxStamina, this.stamina + 1);
        this.staminaRegenTimer = 0;
      }
    }

    this.timeBonusTimer += delta;
    const tick =
      this.bossType != null ? TIME_BONUS.bossTickMs : TIME_BONUS.normalTickMs;
    if (this.timeBonusTimer >= tick && this.timeBonus > 0) {
      this.timeBonus -= 1;
      this.timeBonusTimer = 0;
    }
  }

  private updatePlayer(delta: number) {
    const speed = (PLAYER.speed * delta) / 1000;
    let dx = 0;
    let dy = 0;
    if (this.controls.up) dy -= speed;
    if (this.controls.down) dy += speed;
    if (this.controls.left) dx -= speed;
    if (this.controls.right) dx += speed;

    if (dx !== 0 || dy !== 0) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? "right" : "left";
      } else {
        this.facing = dy > 0 ? "down" : "up";
      }
    }

    const nextX = this.player.x + dx;
    const nextY = this.player.y + dy;
    if (!this.blocking) {
      if (!this.isBlocked(nextX, this.player.y)) this.player.x = nextX;
      if (!this.isBlocked(this.player.x, nextY)) this.player.y = nextY;
    }

    this.handleCombat();

    if (this.invulnTimer > 0) {
      this.player.setAlpha(0.5 + Math.sin(Date.now() / 80) * 0.3);
    } else {
      this.player.setAlpha(1);
    }
    this.shield.setPosition(this.player.x, this.player.y);
  }

  private handleCombat() {
    if (this.controls.block && !this.blocking && this.stamina >= PLAYER.blockMinStamina) {
      this.blocking = true;
      this.blockTimer = PLAYER.blockDurationMs;
      this.shield.setVisible(true);
      this.spawnRingFx(this.player.x, this.player.y, COLORS.block);
    }

    if (this.controls.melee && this.meleeCooldown <= 0 && this.stamina >= PLAYER.meleeMinStamina) {
      this.performMelee();
    }

    if (this.controls.ranged && this.rangedCooldown <= 0 && this.stamina >= PLAYER.rangedMinStamina) {
      this.performRanged();
    }
  }

  private performMelee() {
    this.stamina -= PLAYER.meleeCost;
    this.meleeCooldown = PLAYER.meleeCooldownMs;
    const reach = 22;
    const offsets: Record<Direction, { x: number; y: number }> = {
      up: { x: 0, y: -reach },
      down: { x: 0, y: reach },
      left: { x: -reach, y: 0 },
      right: { x: reach, y: 0 },
    };
    const hitX = this.player.x + offsets[this.facing].x;
    const hitY = this.player.y + offsets[this.facing].y;
    this.spawnSlashFx(hitX, hitY);
    this.cameras.main.shake(80, 0.004);

    for (const enemy of [...this.enemies]) {
      const dist = Phaser.Math.Distance.Between(
        hitX,
        hitY,
        enemy.container.x,
        enemy.container.y,
      );
      if (dist < 18) {
        this.damageEnemy(enemy, PLAYER.meleeDamage);
      }
    }
  }

  private performRanged() {
    this.stamina -= PLAYER.rangedCost;
    this.rangedCooldown = PLAYER.rangedCooldownMs;
    const speed = PLAYER.projectileSpeed;
    let vx = 0;
    let vy = 0;
    if (this.facing === "left") vx = -speed;
    if (this.facing === "right") vx = speed;
    if (this.facing === "up") vy = -speed;
    if (this.facing === "down") vy = speed;

    const bolt = this.add.circle(this.player.x, this.player.y, 4, COLORS.projectile);
    bolt.setStrokeStyle(1, 0xffffff, 0.8);
    this.worldLayer.add(bolt);
    this.projectiles.push({
      sprite: bolt,
      vx,
      vy,
      damage: PLAYER.rangedDamage,
      fromPlayer: true,
      life: 2000,
    });
  }

  private updateEnemies(delta: number) {
    for (const enemy of [...this.enemies]) {
      const container = enemy.container;

      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        container.x,
        container.y,
      );

      if (dist < 50) enemy.chasing = true;

      if (enemy.chasing) {
        const path = findPath(
          this.dungeon.tiles,
          this.worldToGrid(container.x, container.y),
          this.worldToGrid(this.player.x, this.player.y),
        );
        if (path.length > 1) {
          const next = path[1];
          const tx = next.x * TILE_SIZE + TILE_SIZE / 2;
          const ty = next.y * TILE_SIZE + TILE_SIZE / 2;
          const speed = ((enemy.isBoss ? 60 : GHOST.chaseSpeed) * delta) / 1000;
          const angle = Phaser.Math.Angle.Between(container.x, container.y, tx, ty);
          const nx = container.x + Math.cos(angle) * speed;
          const ny = container.y + Math.sin(angle) * speed;
          if (!this.isBlocked(nx, container.y)) container.x = nx;
          if (!this.isBlocked(container.x, ny)) container.y = ny;
        }
        enemy.glow.setFillStyle(enemy.isBoss ? COLORS.boss : COLORS.ghostChase, 0.3);
      } else {
        const speed = ((GHOST.patrolSpeed * enemy.patrolDir) * delta) / 1000;
        const nx = container.x + speed;
        if (!this.isBlocked(nx, container.y)) {
          container.x = nx;
        } else {
          enemy.patrolDir *= -1;
        }
      }

      if (dist < 14 && this.invulnTimer <= 0) {
        if (this.blocking) {
          this.stamina = Math.max(0, this.stamina - PLAYER.blockStaminaCost);
        } else if (Math.random() < GHOST.touchChance) {
          const dmg = enemy.isBoss
            ? BOSSES[enemy.bossType!].touchDamage
            : GHOST.touchDamage;
          this.damagePlayer(dmg);
        }
      }
    }
  }

  private updateProjectiles(delta: number) {
    for (const proj of [...this.projectiles]) {
      proj.life -= delta;
      proj.sprite.x += (proj.vx * delta) / 1000;
      proj.sprite.y += (proj.vy * delta) / 1000;

      if (proj.life <= 0 || this.isBlocked(proj.sprite.x, proj.sprite.y)) {
        proj.sprite.destroy();
        this.projectiles = this.projectiles.filter((p) => p !== proj);
        continue;
      }

      if (proj.fromPlayer) {
        for (const enemy of [...this.enemies]) {
          const dist = Phaser.Math.Distance.Between(
            proj.sprite.x,
            proj.sprite.y,
            enemy.container.x,
            enemy.container.y,
          );
          if (dist < 12) {
            this.damageEnemy(enemy, proj.damage);
            proj.sprite.destroy();
            this.projectiles = this.projectiles.filter((p) => p !== proj);
            break;
          }
        }
      } else if (this.invulnTimer <= 0) {
        const dist = Phaser.Math.Distance.Between(
          proj.sprite.x,
          proj.sprite.y,
          this.player.x,
          this.player.y,
        );
        if (dist < 10) {
          if (this.blocking) {
            this.stamina = Math.max(0, this.stamina - PLAYER.blockStaminaCost);
          } else {
            this.damagePlayer(20);
          }
          proj.sprite.destroy();
          this.projectiles = this.projectiles.filter((p) => p !== proj);
        }
      }
    }
  }

  private damageEnemy(enemy: EnemyObj, amount: number) {
    enemy.hp -= amount;
    const container = enemy.container;
    this.spawnDamageNumber(container.x, container.y - 12, amount, COLORS.melee);
    this.tweens.add({
      targets: container,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 60,
      yoyo: true,
    });

    if (enemy.hp <= 0) {
      if (!enemy.isBoss) {
        this.score += GHOST.killScore;
        this.enemyCount = Math.max(0, this.enemyCount - 1);
        if (Math.random() < GHOST.dropHealChance) {
          this.spawnPickup(container.x, container.y);
        }
      } else {
        this.score += this.timeBonus;
        this.showFloatingText(container.x, container.y, `+${this.timeBonus} TIME BONUS`, COLORS.gold);
        this.enemyCount = 0;
      }
      container.destroy();
      this.enemies = this.enemies.filter((e) => e !== enemy);

      if (this.enemyCount === 0) {
        // Door opening handled in checkDoor()
      }
    }
  }

  private damagePlayer(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
    this.invulnTimer = 800;
    this.cameras.main.shake(120, 0.008);
    this.spawnDamageNumber(this.player.x, this.player.y - 14, amount, COLORS.hp);
    if (this.hp <= 0) {
      this.callbacks.onGameOver(this.score);
    }
  }

  private spawnPickup(x: number, y: number) {
    const heart = this.add.circle(x, y, 5, COLORS.heal);
    heart.setStrokeStyle(1, 0xffffff, 0.8);
    this.worldLayer.add(heart);
    this.pickups.push(heart);
  }

  private checkDoor() {
    if (this.enemyCount > 0) return;

    // Open exit once all enemies are defeated.
    if (this.dungeon.tiles[this.dungeon.door.y][this.dungeon.door.x] === TILE.DOOR_CLOSED) {
      this.setTile(this.dungeon.door.x, this.dungeon.door.y, TILE.DOOR_OPEN);
      return;
    }

    const grid = this.worldToGrid(this.player.x, this.player.y);
    const onDoor =
      grid.x === this.dungeon.door.x &&
      grid.y === this.dungeon.door.y &&
      this.dungeon.tiles[grid.y][grid.x] === TILE.DOOR_OPEN;

    if (!onDoor) return;

    this.score += this.timeBonus;
    this.callbacks.onFloorComplete(this.floor, this.score);
    this.floor += 1;
    this.carryHp = true;
    this.startFloor();
  }

  private collectPickups() {
    for (const pickup of [...this.pickups]) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        pickup.x,
        pickup.y,
      );
      if (dist < 12) {
        this.hp = Math.min(PLAYER.maxHp, this.hp + PICKUP.healAmount);
        pickup.destroy();
        this.pickups = this.pickups.filter((p) => p !== pickup);
        this.spawnRingFx(pickup.x, pickup.y, COLORS.heal);
      }
    }
  }

  private isBlocked(x: number, y: number): boolean {
    const grid = this.worldToGrid(x, y);
    const tile = this.dungeon.tiles[grid.y]?.[grid.x];
    return (
      tile === TILE.WALL ||
      tile === TILE.DOOR_CLOSED ||
      tile === undefined
    );
  }

  private worldToGrid(x: number, y: number): GridPos {
    return {
      x: Math.floor(x / TILE_SIZE),
      y: Math.floor(y / TILE_SIZE),
    };
  }

  private spawnSlashFx(x: number, y: number) {
    const slash = this.add.arc(x, y, 14, 0, 180, false, COLORS.melee, 0.5);
    this.fxLayer.add(slash);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: 180,
      onComplete: () => slash.destroy(),
    });
  }

  private spawnRingFx(x: number, y: number, color: number) {
    const ring = this.add.circle(x, y, 8, color, 0);
    ring.setStrokeStyle(2, color, 0.9);
    this.fxLayer.add(ring);
    this.tweens.add({
      targets: ring,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy(),
    });
  }

  private spawnDamageNumber(x: number, y: number, amount: number, color: number) {
    const text = this.add.text(x, y, `-${amount}`, {
      fontFamily: "monospace",
      fontSize: "10px",
      color: `#${color.toString(16).padStart(6, "0")}`,
    });
    text.setOrigin(0.5);
    this.fxLayer.add(text);
    this.tweens.add({
      targets: text,
      y: y - 18,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });
  }

  private showFloatingText(x: number, y: number, message: string, color: number) {
    const text = this.add.text(x, y, message, {
      fontFamily: "monospace",
      fontSize: "8px",
      color: `#${color.toString(16).padStart(6, "0")}`,
    });
    text.setOrigin(0.5);
    this.fxLayer.add(text);
    this.tweens.add({
      targets: text,
      y: y - 24,
      alpha: 0,
      duration: 1200,
      onComplete: () => text.destroy(),
    });
  }

  private emitSnapshot() {
    const boss = this.enemies.find((e) => e.isBoss);
    this.callbacks.onSnapshot({
      floor: this.floor,
      score: this.score,
      hp: this.hp,
      maxHp: PLAYER.maxHp,
      stamina: this.stamina,
      maxStamina: PLAYER.maxStamina,
      timeBonus: this.timeBonus,
      enemyCount: this.enemyCount,
      inGame: !this.generating,
      bossName: boss?.bossType ? BOSSES[boss.bossType].name : null,
      bossHp: boss?.hp ?? null,
      bossMaxHp: boss?.maxHp ?? null,
    });
  }
}

export function createPhaserGame(
  parent: HTMLElement,
  callbacks: GameCallbacks,
  options?: {
    floor?: number;
    score?: number;
    hp?: number;
    stamina?: number;
    dailySeed?: number;
    carryHp?: boolean;
  },
): Phaser.Game {
  DungeonScene.pendingConfig = { callbacks, ...options };
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth,
    height: parent.clientHeight,
    backgroundColor: "#0b0612",
    scene: DungeonScene,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    fps: { target: 60 },
  });
}

export function startDungeonScene(
  game: Phaser.Game,
  callbacks: GameCallbacks,
  options?: {
    floor?: number;
    score?: number;
    hp?: number;
    stamina?: number;
    dailySeed?: number;
    carryHp?: boolean;
  },
) {
  game.scene.start("DungeonScene", { callbacks, ...options });
}

export function getDungeonScene(game: Phaser.Game): DungeonScene | null {
  return game.scene.getScene("DungeonScene") as DungeonScene;
}
