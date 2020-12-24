import { FFA_SPAWN_RUSSIA, FFA_VALID_SPAWN_ZONES, SHIPS_ENCLOSE_RADIUS } from '../../../constants';
import { PLAYERS_ASSIGN_SPAWN_POSITION } from '../../../events';
import { System } from '../../../server/system';
import { getRandomInt } from '../../../support/numbers';
import { Player } from '../../../types';

export default class GamePlayers extends System {
  constructor({ app }) {
    super({ app });

    this.listeners = {
      [PLAYERS_ASSIGN_SPAWN_POSITION]: this.onAssignPlayerSpawnPosition,
    };
  }

  onAssignPlayerSpawnPosition(player: Player): void {
    let x = 0;
    let y = 0;
    let r = 0;

    /**
     * FFA support spawn zone selection.  Zones are defined in constants/ffa.ts.  
     * A zone can be input by the administrator via the environment, or changed at runtime via a server command.
     */
    let zone = this.config.ffa.spawnZoneName
    let zoneIndex = FFA_VALID_SPAWN_ZONES[zone] || 0
    let spawnZones = this.storage.spawnZoneSet.get(zoneIndex).get(player.planetype.current);

    [x, y] = spawnZones.get(getRandomInt(0, spawnZones.size - 1));
    r = SHIPS_ENCLOSE_RADIUS[player.planetype.current] / 2;

    player.position.x = x + getRandomInt(-r, r);
    player.position.y = y + getRandomInt(-r, r);
  }
}
