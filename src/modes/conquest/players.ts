import { CTF_TEAMS } from '@airbattle/protocol';
import { SHIPS_ENCLOSE_RADIUS } from '../../constants';
import { BROADCAST_PLAYER_RETEAM, PLAYERS_ASSIGN_SPAWN_POSITION, PLAYERS_ASSIGN_TEAM, PLAYERS_UPDATE_TEAM, TIMELINE_GAME_MODE_START } from '../../events';
import { System } from '../../server/system';
import { getRandomInt } from '../../support/numbers';
import { Player, PlayerId } from '../../types';

export default class GamePlayers extends System {
  constructor({ app }) {
    super({ app });

    this.listeners = {
      [PLAYERS_ASSIGN_SPAWN_POSITION]: this.onAssignPlayerSpawnPosition,
      [TIMELINE_GAME_MODE_START]: this.initTeams,
      [PLAYERS_ASSIGN_TEAM]: this.onAssignPlayerTeam,
    };
  }

  onAssignPlayerSpawnPosition(player: Player): void {
    let x = 0;
    let y = 0;
    let r = 0;

    const zoneIndex = 0;
    const spawnZones = this.storage.spawnZoneSet[this.config.server.typeId][this.config.server.mapId].get(zoneIndex).get(0/*player.planetype.current*/);

    [x, y] = spawnZones.get(getRandomInt(0, spawnZones.size - 1));
    r = SHIPS_ENCLOSE_RADIUS[player.planetype.current] / 2;

    player.position.x = x + getRandomInt(-r, r);
    player.position.y = y + getRandomInt(-r, r);
  }

  initTeams(): void {
      const num_players = this.storage.playerList.size;
      const broadcastReteamPlayerIdList: PlayerId[] = new Array(num_players);
      let playersIterator = this.storage.playerList.values();
      let player: Player = playersIterator.next().value;
      let i = 0;
      while (player !== undefined) {
        this.emit(PLAYERS_UPDATE_TEAM, player.id.current, i < num_players/2 ? CTF_TEAMS.BLUE : CTF_TEAMS.RED);
        broadcastReteamPlayerIdList[i] = player.id.current;
        player = playersIterator.next().value;
        i++;
      }
      this.emit(BROADCAST_PLAYER_RETEAM, broadcastReteamPlayerIdList);
  }

  onAssignPlayerTeam(player: Player): void {
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
      blueTeam = this.storage.connectionIdByTeam.get(CTF_TEAMS.BLUE)?.size || 0;
      redTeam = this.storage.connectionIdByTeam.get(CTF_TEAMS.RED)?.size || 0;
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
