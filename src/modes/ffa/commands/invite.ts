import { BROADCAST_CHAT_SERVER_WHISPER, COMMAND_INVITE } from '../../../events';
import { System } from '../../../server/system';
import { ConnectionId } from '../../../types';

export default class InviteCommandHandler extends System {
  constructor({ app }) {
    super({ app });

    this.listeners = {
      [COMMAND_INVITE]: this.onCommandReceived,
    };
  }

  onCommandReceived(connectionId: ConnectionId, data: string): void {
    if (!this.config.ffa.enableTeams) {
      return;
    }
    const connection = this.storage.connectionList.get(connectionId);
    const { playerId } = connection;
    const invitee_id = parseInt(data);

    this.storage.teamInvites[playerId] = (this.storage.teamInvites[playerId] || new Set()).add(invitee_id);
    const player = this.storage.playerList.get(playerId);
    
    this.emit(BROADCAST_CHAT_SERVER_WHISPER, invitee_id, `${player.name.current} has invited you to his team. Type /join ${player.name.current}`);
  }
}
