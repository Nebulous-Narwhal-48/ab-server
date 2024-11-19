import { CTF_TEAMS, GAME_TYPES } from '@airbattle/protocol';
import { FFA_VALID_SPAWN_ZONES, SHIPS_ENCLOSE_RADIUS } from '../../../constants';
import { PLAYERS_ASSIGN_SPAWN_POSITION, PLAYERS_ASSIGN_TEAM, TIMELINE_BEFORE_GAME_START } from '../../../events';
import { System } from '../../../server/system';
import { getRandomInt } from '../../../support/numbers';
import { Player } from '../../../types';

export default class GamePlayers extends System {
  constructor({ app }) {
    super({ app });

    this.listeners = {
      [PLAYERS_ASSIGN_SPAWN_POSITION]: this.onAssignPlayerSpawnPosition,
      [TIMELINE_BEFORE_GAME_START]: this.initTeams,
      [PLAYERS_ASSIGN_TEAM]: this.onAssignPlayerTeam,
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
    const zoneIndex = FFA_VALID_SPAWN_ZONES[this.config.ffa.spawnZoneName];
    const spawnZones = this.storage.spawnZoneSet.get(zoneIndex).get(player.planetype.current);

    [x, y] = spawnZones.get(getRandomInt(0, spawnZones.size - 1));
    r = SHIPS_ENCLOSE_RADIUS[player.planetype.current] / 2;

    player.position.x = x + getRandomInt(-r, r);
    player.position.y = y + getRandomInt(-r, r);
  }

  initTeams(): void {
    if (!(this.config.server.typeId == GAME_TYPES.FFA && this.config.ffa.tdmMode))
      return; 
    this.storage.connectionIdByTeam.set(CTF_TEAMS.BLUE, new Set());
    this.storage.connectionIdByTeam.set(CTF_TEAMS.RED, new Set());
  }

  onAssignPlayerTeam(player: Player): void {
    if (!(this.config.server.typeId == GAME_TYPES.FFA && this.config.ffa.tdmMode))
      return;
    
    let blueTeam = 0;
    let redTeam = 0;

    if (player.bot.current) {
      this.storage.botIdList.forEach(botId => {
        const bot = this.storage.playerList.get(botId);

        if (bot.team.current === CTF_TEAMS.BLUE) {
          blueTeam += 1;
        } else {
          redTeam += 1;
        }
      });
    } else {
      blueTeam = this.storage.connectionIdByTeam.get(CTF_TEAMS.BLUE).size;
      redTeam = this.storage.connectionIdByTeam.get(CTF_TEAMS.RED).size;
    }

    if (blueTeam > redTeam) {
      player.team.current = CTF_TEAMS.RED;
    } else if (blueTeam < redTeam) {
      player.team.current = CTF_TEAMS.BLUE;
    } else {
      player.team.current = getRandomInt(0, 1) === 0 ? CTF_TEAMS.BLUE : CTF_TEAMS.RED;
    }
  }
}
