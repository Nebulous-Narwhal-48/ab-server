import { MOB_TYPES } from '@airbattle/protocol';
import { POWERUPS_ADD_PERIODIC, POWERUPS_CLEAR_PERIODICS, TIMELINE_GAME_MODE_START } from '../../../events';
import { System } from '../../../server/system';
import { PeriodicPowerupTemplate } from '../../../types';

export default class ShieldsPeriodic extends System {
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
       * Blue base shield.
       */
      {
        interval: 90,
        randomInterval: this.config.ctf.randomBaseShieldInterval,
        posX: -9300,
        posY: -1480,
        type: MOB_TYPES.SHIELD,
      } as PeriodicPowerupTemplate,

      /**
       * Red base shield.
       */
      {
        interval: 90,
        randomInterval: this.config.ctf.randomBaseShieldInterval,
        posX: 8350,
        posY: -935,
        type: MOB_TYPES.SHIELD,
      } as PeriodicPowerupTemplate,
    ]);

    this.log.debug('Periodic shields loaded.');
  }
}
