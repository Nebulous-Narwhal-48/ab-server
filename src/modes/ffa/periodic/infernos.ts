import { MOB_TYPES } from '@airbattle/protocol';
import { POWERUPS_ADD_PERIODIC, POWERUPS_CLEAR_PERIODICS, TIMELINE_GAME_MODE_START } from '../../../events';
import { System } from '../../../server/system';
import { PeriodicPowerupTemplate } from '../../../types';

export default class InfernosPeriodic extends System {
  constructor({ app }) {
    super({ app });

    this.listeners = {
      [TIMELINE_GAME_MODE_START]: this.init,
    };
  }

  override onStop() {
    this.emit(POWERUPS_CLEAR_PERIODICS);
  }

  init(): void {
    this.emit(POWERUPS_ADD_PERIODIC, [
      /**
       * Europe inferno.
       */
      {
        interval: 105,
        posX: 920,
        posY: -2800,
        type: MOB_TYPES.INFERNO,
      } as PeriodicPowerupTemplate,
    ]);

    if (this.config.ffa.baseInfernos) {
      this.emit(POWERUPS_ADD_PERIODIC, [
        /**
         * Blue base inferno.
         */
        {
          interval: 105,
          posX: -7440,
          posY: -1360,
          type: MOB_TYPES.INFERNO,
        } as PeriodicPowerupTemplate,

        /**
         * Red base inferno.
         */
        {
          interval: 105,
          posX: 6565,
          posY: -935,
          type: MOB_TYPES.INFERNO,
        } as PeriodicPowerupTemplate,
      ]);
    }

    this.log.debug('Periodic infernos loaded.');
  }
}
