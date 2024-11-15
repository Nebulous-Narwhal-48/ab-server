import { BROADCAST_CHAT_SERVER_WHISPER, COMMAND_ADD_SKIN, RESPONSE_COMMAND_REPLY, CONNECTIONS_SEND_PACKETS } from '../../events';
import { MainConnectionId } from '../../types';
import { System } from '../system';
import { ServerPackets, SERVER_CUSTOM_TYPES, SERVER_PACKETS } from '@airbattle/protocol';

export default class SkinCommandHandler extends System {
  constructor({ app }) {
    super({ app });

    this.listeners = {
      [COMMAND_ADD_SKIN]: this.onCommandReceived,
    };
  }

  onCommandReceived(connectionId: MainConnectionId, commandArguments: string): void {
    if (!this.config.skins.enable) {
      return;
    }

    const connection = this.storage.connectionList.get(connectionId);
    const { playerId } = connection;
    const player = this.storage.playerList.get(playerId);

    try {
      const { cmd, url, hash, player_id:target_id } = JSON.parse(commandArguments);

      let target;
      if (target_id) {
        target = this.storage.playerList.get(target_id);
        if (!target || !target.user?.id) {
          this.emit(RESPONSE_COMMAND_REPLY, connectionId, `Target not found`);
          return;         
        }
      }

      let sync_player_skins = true, sync_target_skins = false;
      if (cmd == "add") {
        this.add(url, hash, player, connectionId);
      } else if (cmd == "remove") {
        this.remove(url, player, connectionId);
      } else if (cmd == "transfer") {
        this.transfer(url, target, player, connectionId);
        sync_target_skins = true;
      }

      if (sync_player_skins) {
        const skins = this.storage.skins.byUser.get(player.user.id).map(x=>x.url);
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

      if (sync_target_skins) {
        const skins = this.storage.skins.byUser.get(target.user.id).map(x=>x.url);
        this.emit(
          CONNECTIONS_SEND_PACKETS,
          {
            c: SERVER_PACKETS.SERVER_CUSTOM,
            type: 201 as SERVER_CUSTOM_TYPES, //TODO: add new SERVER_CUSTOM_TYPES
            data: JSON.stringify({
              skins,
            }),
          } as ServerPackets.ServerCustom,
          this.storage.playerMainConnectionList.get(target_id)
        );
      }

    } catch (e) {
      throw e;
      this.emit(RESPONSE_COMMAND_REPLY, connectionId, `Error`);
    }
  }

  add(url, hash, player, connectionId: MainConnectionId) {
    // check if already exists
    if (this.storage.skins.byUrl.has(url)) {
      this.emit(RESPONSE_COMMAND_REPLY, connectionId, `Already exists`);
      return;
    }

    // check if user has permission
    if (!(player.su.current || player.level.current >= this.config.skins.minUserLevel)) {
      this.emit(RESPONSE_COMMAND_REPLY, connectionId, `Minimum level: ${this.config.skins.minUserLevel}`);
      return;
    }

    this.storage.skins.byUrl.set(url, {url, hash, user_id: player.user.id, created_by: player.user.id});
    this.storage.skins.byUser.set(player.user.id, (this.storage.skins.byUser.get(player.user.id)||[]).concat({url, hash, user_id: player.user.id, created_by: player.user.id}));
    this.storage.skins.hasChanges = true;

    this.emit(BROADCAST_CHAT_SERVER_WHISPER, player.id.current, `Skin added`);
  }

  remove(url, player, connectionId: MainConnectionId) {
    let skin = this.storage.skins.byUrl.get(url);
    if (!skin) {
      this.emit(RESPONSE_COMMAND_REPLY, connectionId, `Url not found`);
      return;   
    }

    if (skin.user_id != player.user.id && !player.su.current) {
      this.emit(RESPONSE_COMMAND_REPLY, connectionId, `No permissions`);
      return;
    }
    
    this.storage.skins.byUrl.delete(url);
    this.storage.skins.byUser.set(player.user.id, this.storage.skins.byUser.get(player.user.id).filter(x=>x.url!==url));
    this.storage.skins.hasChanges = true;

    this.emit(BROADCAST_CHAT_SERVER_WHISPER, player.id.current, `Skin removed`);
  }
  
  transfer(url, target, player, connectionId: MainConnectionId) {
    let skin = this.storage.skins.byUrl.get(url);
    if (!skin) {
      this.emit(RESPONSE_COMMAND_REPLY, connectionId, `Url not found`);
      return;   
    }

    if (skin.user_id != player.user.id && !player.su.current) {
      this.emit(RESPONSE_COMMAND_REPLY, connectionId, `No permissions`);
      return;
    }

    skin.user_id = target.user.id;
    this.storage.skins.byUrl.delete(url);
    this.storage.skins.byUser.set(player.user.id, this.storage.skins.byUser.get(player.user.id).filter(x=>x.url!==url));
    this.storage.skins.byUrl.set(url, skin);
    this.storage.skins.byUser.set(target.user.id, (this.storage.skins.byUser.get(target.user.id)||[]).concat(skin))
    this.storage.skins.hasChanges = true;

    this.emit(BROADCAST_CHAT_SERVER_WHISPER, player.id.current, `Skin transferred`);
    this.emit(BROADCAST_CHAT_SERVER_WHISPER, target.id.current, `Skin transferred`);
  }
}
