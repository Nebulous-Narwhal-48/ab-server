import Match from '../../server/components/game/match';
import GameManifest from '../../server/mainfest';
import DropCommandHandler from '../ctf/commands/drop';
import GameFlag from './maintenance/flag';
import InviteCommandHandler from './commands/invite';
import JoinCommandHandler from './commands/join';
import GamePlayers from './maintenance/players';
import InfernosPeriodic from './periodic/infernos';
import ScoreDetailedResponse from './responses/score-detailed';

export default class FFAGameManifest extends GameManifest {
  constructor({ app }) {
    super({ app });

    this.systems = [
      // Maintenance.
      GamePlayers,

      // Responses.
      ScoreDetailedResponse,

      // Periodic.
      InfernosPeriodic,

      // Commands
      InviteCommandHandler,
      JoinCommandHandler,
    ];

    if (this.app.config.ffa.enableFlag) {
      this.systems = [GameFlag, DropCommandHandler];
    }

    this.startSystems();

    this.app.storage.gameEntity.attach(new Match());
  }

  stopSystems(): void {
    this.app.log.debug('Stopping FFA systems');
    const loadedSystems = [...this.app.systems];
    [GamePlayers, ScoreDetailedResponse, InfernosPeriodic, InviteCommandHandler, JoinCommandHandler, GameFlag, DropCommandHandler].forEach(systemToStop => {
      const system = loadedSystems.find(system => system.constructor.name === systemToStop.name);
      this.app.stopSystem(system);
    });
  }
}
