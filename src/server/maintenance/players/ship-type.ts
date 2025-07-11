import { SHIPS_SPECS, SPECIAL_ABILITIES, UPGRADES_SPECS } from '../../../constants';
import { PLAYERS_REPEL_ADD, PLAYERS_REPEL_DELETE, PLAYERS_SET_SHIP_TYPE } from '../../../events';
import { Player } from '../../../types';
import { System } from '../../system';

export default class GamePlayersShipType extends System {
  constructor({ app }) {
    super({ app });

    this.listeners = {
      [PLAYERS_SET_SHIP_TYPE]: this.onSetPlayerShipType,
    };
  }

  onSetPlayerShipType(player: Player, shipType: number): void {
    const previousType = player.planetype.current;

    player.planetype.current = shipType;
    player.hitcircles.current = [...SHIPS_SPECS[shipType].collisions];
    player.energy.regen =
      SHIPS_SPECS[shipType].energyRegen * UPGRADES_SPECS.ENERGY.factor[player.upgrades.energy];

    if (SHIPS_SPECS[previousType].special === SPECIAL_ABILITIES.REPEL) {
      this.emit(PLAYERS_REPEL_DELETE, player);
    }

    if (SHIPS_SPECS[shipType].special === SPECIAL_ABILITIES.REPEL) {
      this.emit(PLAYERS_REPEL_ADD, player);
    }
  }
}
