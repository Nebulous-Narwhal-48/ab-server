import { MS_PER_SEC } from '../../constants';
import {
  POWERUPS_ADD_PERIODIC,
  POWERUPS_CLEAR_PERIODICS,
  POWERUPS_DESPAWNED,
  POWERUPS_SPAWN,
  TIMELINE_CLOCK_SECOND,
  TIMELINE_GAME_MATCH_START,
} from '../../events';
import { getRandomInt } from '../../support/numbers';
import { has } from '../../support/objects';
import { MobId, PeriodicPowerup, PeriodicPowerupTemplate } from '../../types';
import { System } from '../system';

export default class PowerupsPeriodic extends System {
  private spawnedPowerups: Map<MobId, PeriodicPowerup> = new Map();

  private powerups: PeriodicPowerup[] = [];

  constructor({ app }) {
    super({ app });

    this.listeners = {
      [POWERUPS_ADD_PERIODIC]: this.addPowerups,
      [POWERUPS_DESPAWNED]: this.onPowerupDespawned,
      [TIMELINE_CLOCK_SECOND]: this.checkSpawn,
      [TIMELINE_GAME_MATCH_START]: this.spawnPowerups,
      [POWERUPS_CLEAR_PERIODICS]: this.clearPowerups,
    };
  }

  addPowerups(powerups: PeriodicPowerupTemplate | PeriodicPowerupTemplate[]): void {
    if (Array.isArray(powerups)) {
      for (let index = 0; index < powerups.length; index += 1) {
        this.addPowerup(powerups[index]);
      }
    } else {
      this.addPowerup(powerups);
    }
  }

  spawnPowerups(): void {
    for (let index = 0; index < this.powerups.length; index += 1) {
      if (this.powerups[index].mobId === null) {
        this.spawnPowerup(index);
      }
    }
  }

  onPowerupDespawned(mobId: MobId): void {
    if (this.spawnedPowerups.has(mobId)) {
      const powerup = this.spawnedPowerups.get(mobId);

      powerup.lastUpdate = Date.now();
      powerup.mobId = null;

      if (has(powerup, 'randomInterval')) {
        powerup.lastUpdate += getRandomInt(0, powerup.randomInterval) * MS_PER_SEC;
      }

      this.spawnedPowerups.delete(mobId);
    }
  }

  checkSpawn(): void {
    /**
     * Skip check if all periodic powerups have already spawned.
     */
    if (this.powerups.length === this.spawnedPowerups.size) {
      return;
    }

    const now = Date.now();

    for (let index = 0; index < this.powerups.length; index += 1) {
      const powerup = this.powerups[index];

      if (powerup.mobId === null && powerup.lastUpdate < now - powerup.interval) {
        this.spawnPowerup(index);
      }
    }
  }

  private addPowerup(powerupTemplate: PeriodicPowerupTemplate): void {
    const powerup = {
      ...powerupTemplate,
      lastUpdate: 0,
      mobId: null,
      permanent: true,
    } as PeriodicPowerup;

    powerup.interval *= MS_PER_SEC;

    this.storage.powerupSpawns[this.config.server.typeId][this.config.server.mapId].forEach(spawn => {
      if (
        powerup.posX >= spawn.x &&
        powerup.posX <= spawn.x + spawn.width &&
        powerup.posY >= spawn.y &&
        powerup.posY <= spawn.y + spawn.height
      ) {
        powerup.chunkId = spawn.id;
      }
    });

    this.powerups.push(powerup);
  }

  private spawnPowerup(powerupIndex: number): void {
    const powerup = this.powerups[powerupIndex];

    powerup.mobId = this.helpers.createMobId();
    powerup.lastUpdate = Date.now();

    this.emit(POWERUPS_SPAWN, powerup);
    this.spawnedPowerups.set(powerup.mobId, powerup);
  }

  private clearPowerups() {
    this.powerups = [];
    this.spawnedPowerups = new Map();
  }
}
