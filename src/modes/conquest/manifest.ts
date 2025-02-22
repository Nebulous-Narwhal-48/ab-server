import Match from '../../server/components/game/match';
import GameManifest from '../../server/mainfest';
import GamePlayers from './players';
import InfernosPeriodic from '../ffa/periodic/infernos';
import ScoreDetailedResponse from '../ffa/responses/score-detailed';
import Controlpoints from './controlpoints';

export default class ConquestGameManifest extends GameManifest {
  constructor({ app }) {
    super({ app });

    this.systems = [
      // Maintenance.
      GamePlayers,
      Controlpoints,

      // Responses.
      ScoreDetailedResponse,

      // Periodic.
      InfernosPeriodic,
    ];

    this.startSystems();

    this.app.storage.gameEntity.attach(new Match());
    this.app.storage.gameEntity.match.isActive = false;
  }

  stopSystems(): void {
    this.app.log.debug('Stopping CON systems');
    const loadedSystems = [...this.app.systems];
    [GamePlayers, ScoreDetailedResponse, InfernosPeriodic, Controlpoints].forEach(systemToStop => {
      const system = loadedSystems.find(system => system.constructor.name === systemToStop.name);
      this.app.stopSystem(system);
    });
  }
}
