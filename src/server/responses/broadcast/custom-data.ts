import { ServerPackets, SERVER_CUSTOM_TYPES, SERVER_PACKETS } from '@airbattle/protocol';
import { BROADCAST_CUSTOM_DATA, CONNECTIONS_SEND_PACKETS } from '../../../events';
import { System } from '../../../server/system';
import { MainConnectionId, Player, PlayerId } from '../../../types';

export default class CustomDataBroadcast extends System {
  constructor({ app }) {
    super({ app });

    this.listeners = {
      [BROADCAST_CUSTOM_DATA]: this.onCustomData,
    };
  }

  /**
   * called by onCreatePlayer
   */
  onCustomData(playerId: PlayerId): void {
    const broadcast_recipients = [...this.storage.mainConnectionIdList];
    const player = this.storage.playerList.get(playerId);
    const playersIterator = this.storage.playerList.values();
    const players = [];

    // broadcast the player data to all players
    if (player.customdata?.custom_data.hash) {
      this.emit(
        CONNECTIONS_SEND_PACKETS,
        {
          c: SERVER_PACKETS.SERVER_CUSTOM,
          type: 200 as SERVER_CUSTOM_TYPES, //TODO: add new SERVER_CUSTOM_TYPES,
          data: JSON.stringify({
            player_id: playerId,
            custom_data: player.customdata.custom_data,
          }),
        } as ServerPackets.ServerCustom,
        broadcast_recipients
      );
    }

    // send to player all other players data
    let _player: Player = playersIterator.next().value;
    while (_player !== undefined) {
      if (_player.id != player.id && _player.customdata?.custom_data?.hash) {
        players.push({
          id: _player.id.current,
          custom_data: _player.customdata.custom_data
        });
      }
      _player = playersIterator.next().value;
    }

    if (players.length) {
      this.emit(
        CONNECTIONS_SEND_PACKETS,
        {
          c: SERVER_PACKETS.SERVER_CUSTOM,
          type: 201 as SERVER_CUSTOM_TYPES, //TODO: add new SERVER_CUSTOM_TYPES
          data: JSON.stringify({
            players,
          }),
        } as ServerPackets.ServerCustom,
        this.storage.playerMainConnectionList.get(playerId)
      );
    }

    // send available skins (only if no localStorage)
    if (player.customdata && player.customdata.custom_data.my_skins_len === null) {
      const skins = this.storage.skins.byUser.get(player.user.id).map(x=>x.url);
      if (skins.length) {
        this.emit(
          CONNECTIONS_SEND_PACKETS,
          {
            c: SERVER_PACKETS.SERVER_CUSTOM,
            type: 201 as SERVER_CUSTOM_TYPES, //TODO: add new SERVER_CUSTOM_TYPES
            data: JSON.stringify({
              skins,
            }),
          } as ServerPackets.ServerCustom,
          this.storage.playerMainConnectionList.get(playerId)
        );
      }
    }
  }
}