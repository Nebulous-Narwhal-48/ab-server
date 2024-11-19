import { BROADCAST_PLAYER_RETEAM, COMMAND_JOIN, PLAYERS_UPDATE_TEAM} from '../../../events';
import { System } from '../../../server/system';
import { ConnectionId } from '../../../types';

export default class JoinCommandHandler extends System {
  constructor({ app }) {
    super({ app });

    this.listeners = {
      [COMMAND_JOIN]: this.onCommandReceived,
    };
  }

  onCommandReceived(connectionId: ConnectionId, data: string): void {
    if (!this.config.ffa.enableTeams) {
      return;
    }

    const connection = this.storage.connectionList.get(connectionId);
    const { playerId } = connection;
    const inviter_id = parseInt(data);
    const team_id = this.storage.playerList.get(inviter_id).team.current;

    if (!this.storage.teamInvites[inviter_id] || !this.storage.teamInvites[inviter_id].has(playerId)) {
      // TODO: send error msg
      return;
    }

    this.emit(PLAYERS_UPDATE_TEAM, playerId, team_id);
    this.emit(BROADCAST_PLAYER_RETEAM, [playerId]);
  }
}
