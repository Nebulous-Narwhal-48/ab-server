import { BTR_SHIPS_TYPES_ORDER } from '../../constants';
import RespawnCommandHandler from '../../server/commands/respawn';
import Match from '../../server/components/game/match';
import GameManifest from '../../server/mainfest';
import BTRRespawnCommandHandler from './commands/respawn';
import GameEndpointAPI from './maintenance/api';
import GameMatches from './maintenance/matches';
import GamePlayers from './maintenance/players';
import GameFirewallBroadcast from './responses/broadcast/game-firewall';
import PlayersAliveBroadcast from './responses/broadcast/players-alive';
import ServerCustomBroadcast from './responses/broadcast/server-custom';
import ScoreDetailedResponse from './responses/score-detailed';

export default class BTRGameManifest extends GameManifest {
  constructor({ app }) {
    super({ app });

    const RespawnCommandSystem = [...this.app.systems].find(
      system => system.constructor === RespawnCommandHandler
    );

    this.app.stopSystem(RespawnCommandSystem);

    this.systems = [
      // Broadcast.
      ServerCustomBroadcast,
      GameFirewallBroadcast,
      PlayersAliveBroadcast,

      // Commands.
      BTRRespawnCommandHandler,

      // Responses.
      ScoreDetailedResponse,

      // Maintenance.
      GameEndpointAPI,
      GameMatches,
      GamePlayers,
    ];

    this.startSystems();

    this.app.storage.gameEntity.attach(new Match());

    this.app.storage.gameEntity.match.isActive = false;

    const [shipType] = BTR_SHIPS_TYPES_ORDER;

    this.app.storage.gameEntity.match.shipType = shipType;
  }

  stopSystems(): void {
    const loadedSystems = [...this.app.systems];
    [ServerCustomBroadcast, GameFirewallBroadcast, PlayersAliveBroadcast, BTRRespawnCommandHandler, ScoreDetailedResponse, GameEndpointAPI, GameMatches, GamePlayers,].forEach(systemToStop => {
      const system = loadedSystems.find(system => system.constructor.name === systemToStop.name);
      this.app.stopSystem(system);
    });
  }
}
