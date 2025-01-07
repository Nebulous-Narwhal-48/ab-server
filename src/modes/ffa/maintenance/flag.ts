import { CTF_CAPTURE_BOUNTY, CTF_FLAG_STATE, CTF_TEAMS, SERVER_MESSAGE_TYPES, SERVER_PACKETS, ServerPackets } from '@airbattle/protocol';
import { Circle, Polygon } from 'collisions';
import {
  COLLISIONS_OBJECT_TYPES,
  CTF_FLAG_COLLISIONS,
  CTF_FLAG_OWNER_INACTIVITY_TIMEOUT_MS,
  CTF_RETURNED_FLAG_INACTIVITY_TIMEOUT_MS,
  MAP_SIZE,
  MS_PER_SEC,
  PLAYERS_ALIVE_STATUSES,
} from '../../../constants';
import {
  BROADCAST_FLAG_CAPTURED,
  BROADCAST_FLAG_RETURNED,
  BROADCAST_FLAG_TAKEN,
  BROADCAST_GAME_FLAG,
  BROADCAST_PLAYER_UPDATE,
  BROADCAST_SERVER_MESSAGE,
  COLLISIONS_ADD_OBJECT,
  CONNECTIONS_SEND_PACKETS,
  CTF_CARRIER_KILLED,
  CTF_PLAYER_DROP_FLAG,
  CTF_PLAYER_TOUCHED_FLAG,
  PLAYERS_BEFORE_REMOVE,
  PLAYERS_CREATED,
  RESPONSE_SCORE_UPDATE,
  TIMELINE_GAME_MODE_START,
  TIMELINE_CLOCK_MINUTE,
  TIMELINE_CLOCK_10_SECONDS,
  TIMELINE_CLOCK_5_SECONDS,
  TIMELINE_CLOCK_SECOND,
  COLLISIONS_REMOVE_OBJECT,
} from '../../../events';
import FlagState from '../../../server/components/flag-state';
import HitCircles from '../../../server/components/hit-circles';
import Hitbox from '../../../server/components/hitbox';
import Id from '../../../server/components/mob-id';
import Owner from '../../../server/components/owner';
import Position from '../../../server/components/position';
import Rotation from '../../../server/components/rotation';
import Team from '../../../server/components/team';
import Entity from '../../../server/entity';
import { System } from '../../../server/system';
import { Flag, MobId, Player, PlayerId } from '../../../types';
import { escapeHTML } from '../../../support/strings';

export default class GameFlag extends System {
  private flag: Flag

  constructor({ app }) {
    super({ app });

    this.listeners = {
      [CTF_CARRIER_KILLED]: this.onPlayerLostFlag,
      [CTF_PLAYER_DROP_FLAG]: this.onPlayerDropFlag,
      [CTF_PLAYER_TOUCHED_FLAG]: this.onPlayerTouchedFlag,
      [PLAYERS_BEFORE_REMOVE]: this.onPlayerDelete,
      [TIMELINE_GAME_MODE_START]: this.onGameModeStart,
      [TIMELINE_CLOCK_MINUTE]: this.checkFlagsState,
      [PLAYERS_CREATED]: this.onPlayersCreated,
      [TIMELINE_CLOCK_10_SECONDS]: this.updateScore,
    };
  }

  override onStop() {
    // remove collisions
    this.emit(COLLISIONS_REMOVE_OBJECT, this.flag.hitbox.current);  

    // drop flag/reset player state
    if (this.flag.owner.current !== 0) {
      this.onPlayerLostFlag(this.flag.owner.current, true);
    }
  }

  onGameModeStart() {
    if (!this.storage.ffaFlagRedId) {
      this.initFlagElements();
    } else {
      const flag = this.flag = this.storage.mobList.get(this.storage.ffaFlagRedId) as Flag;
      const [x, y] = [0, 0];

      flag.position.x = x;
      flag.position.y = y;
      flag.owner.previous = 0;
      flag.owner.current = 0;
      flag.owner.lastDrop = Date.now();
      flag.flagstate.returned = true;
      flag.flagstate.captured = false;
      flag.flagstate.dropped = false;
      flag.hitbox.x = x + MAP_SIZE.HALF_WIDTH + this.storage.flagHitboxesCache.x;
      flag.hitbox.y = y + MAP_SIZE.HALF_HEIGHT + this.storage.flagHitboxesCache.y;
      flag.hitbox.height = this.storage.flagHitboxesCache.height;
      flag.hitbox.width = this.storage.flagHitboxesCache.width;
      flag.hitbox.current.x = flag.hitbox.x - this.storage.flagHitboxesCache.x;
      flag.hitbox.current.y = flag.hitbox.y - this.storage.flagHitboxesCache.y;

      // broadcast flag
      this.onPlayersCreated(null)
    }

    this.emit(COLLISIONS_ADD_OBJECT, this.flag.hitbox.current);
  }

  initFlagElements(): void {
    this.storage.ffaFlagRedId = this.helpers.createServiceMobId();
        
    //const [x, y] = CTF_FLAGS_POSITIONS[CTF_TEAMS.RED];
    const [x, y] = [0, 0];

    const redFlag: Flag = new Entity().attach(
      new FlagState(),
      new Hitbox(),
      new HitCircles([...CTF_FLAG_COLLISIONS]),
      new Id(this.storage.ffaFlagRedId),
      new Owner(),
      new Position(x, y),
      new Rotation(),
      new Team(CTF_TEAMS.RED)
    );

    redFlag.hitbox.x = x + MAP_SIZE.HALF_WIDTH + this.storage.flagHitboxesCache.x;
    redFlag.hitbox.y = y + MAP_SIZE.HALF_HEIGHT + this.storage.flagHitboxesCache.y;
    redFlag.hitbox.height = this.storage.flagHitboxesCache.height;
    redFlag.hitbox.width = this.storage.flagHitboxesCache.width;

    const hitbox = new Circle(
      redFlag.hitbox.x - this.storage.flagHitboxesCache.x,
      redFlag.hitbox.y - this.storage.flagHitboxesCache.y,
      this.storage.flagHitboxesCache.width / 2
    );

    hitbox.id = redFlag.id.current;
    hitbox.type = COLLISIONS_OBJECT_TYPES.FLAG;
    hitbox.isCollideWithPlayer = true;
    redFlag.hitbox.current = hitbox;

    //this.emit(COLLISIONS_ADD_OBJECT, redFlag.hitbox.current);
    this.storage.mobList.set(this.storage.ffaFlagRedId, redFlag);
    this.flag = redFlag;

    this.log.debug('Red flag added.');
  }

  onPlayersCreated(playerId: PlayerId) {
    setTimeout(() => {
      const flag = this.flag;
      this.emit(
        CONNECTIONS_SEND_PACKETS,
        {
          c: SERVER_PACKETS.GAME_FLAG,
          type: flag.owner.current === 0 ? CTF_FLAG_STATE.STATIC : CTF_FLAG_STATE.DYNAMIC,
          flag: 2,
          id: flag.owner.current,
          posX: flag.position.x,
          posY: flag.position.y,
          blueteam: this.storage.gameEntity.match.blue,
          redteam: this.storage.gameEntity.match.red,
        } as ServerPackets.GameFlag,
        playerId === null
          ? [...this.storage.mainConnectionIdList]
          : this.storage.playerMainConnectionList.get(playerId)
      );
    }, 100);
  }

  onPlayerTouchedFlag(playerId: PlayerId, flagId: MobId): void {
    const flag = this.storage.mobList.get(flagId) as Flag;
    const player = this.storage.playerList.get(playerId);

    /**
     * Player might be killed at the same tick,
     * so check its status.
     */
    if (
      player.planestate.stealthed ||
      player.alivestatus.current !== PLAYERS_ALIVE_STATUSES.ALIVE
    ) {
      return;
    }

    if (
      (flag.owner.previous === playerId &&
        flag.owner.lastDrop > Date.now() - CTF_FLAG_OWNER_INACTIVITY_TIMEOUT_MS) ||
      flag.flagstate.lastReturn > Date.now() - CTF_RETURNED_FLAG_INACTIVITY_TIMEOUT_MS
    ) {
      return;
    }
    
    flag.owner.current = player.id.current;
    player.planestate.flagspeed = true;
    flag.flagstate.returned = false;
    flag.flagstate.dropped = false;
    flag.flagstate.captured = true;

    flag.hitbox.x = MAP_SIZE.WIDTH + 1000;
    flag.hitbox.y = MAP_SIZE.HEIGHT + 1000;
    flag.hitbox.current.x = flag.hitbox.x;
    flag.hitbox.current.y = flag.hitbox.y;

    this.emit(BROADCAST_PLAYER_UPDATE, player.id.current);

    //this.emit(BROADCAST_FLAG_TAKEN, flag.team.current, player.name.current);
    this.emit(
      BROADCAST_SERVER_MESSAGE,
      `<span class="info inline"><span class="${
        false ? 'blueflag' : 'redflag'
      }"></span></span>Taken by ${escapeHTML(player.name.current)}`,
      SERVER_MESSAGE_TYPES.INFO,
      3 * MS_PER_SEC
    );
    

    //this.emit(BROADCAST_GAME_FLAG, flag.team.current);
    this.emit(
      CONNECTIONS_SEND_PACKETS,
      {
        c: SERVER_PACKETS.GAME_FLAG,
        type: CTF_FLAG_STATE.DYNAMIC,
        flag: 2,  //1=blu 2=red
        id: flag.owner.current,
        posX: flag.position.x,
        posY: flag.position.y,
        blueteam: 0,
        redteam: 0,
      } as ServerPackets.GameFlag,
      [...this.storage.mainConnectionIdList]
    );

  }

  onPlayerDelete(player: Player): void {
    if (!player.planestate.flagspeed) {
      return;
    }

    const flag = this.flag;

    flag.owner.previous = player.id.current;
    flag.owner.current = 0;
    flag.owner.lastDrop = Date.now();
    flag.flagstate.returned = false;
    flag.flagstate.dropped = false;
    flag.flagstate.captured = false;

    /**
     * Update flag position and hitbox.
     */
    flag.position.x = player.position.x;
    flag.position.y = player.position.y;
    flag.hitbox.x = ~~flag.position.x + MAP_SIZE.HALF_WIDTH + this.storage.flagHitboxesCache.x;
    flag.hitbox.y = ~~flag.position.y + MAP_SIZE.HALF_HEIGHT + this.storage.flagHitboxesCache.y;
    flag.hitbox.height = this.storage.flagHitboxesCache.height;
    flag.hitbox.width = this.storage.flagHitboxesCache.width;
    flag.hitbox.current.x = flag.hitbox.x - this.storage.flagHitboxesCache.x;
    flag.hitbox.current.y = flag.hitbox.y - this.storage.flagHitboxesCache.y;

    this.emit(
      CONNECTIONS_SEND_PACKETS,
      {
        c: SERVER_PACKETS.GAME_FLAG,
        type: CTF_FLAG_STATE.STATIC,
        flag: 2, //1=blu 2=red
        id: flag.owner.current,
        posX: flag.position.x,
        posY: flag.position.y,
        blueteam: 0,
        redteam: 0,
      } as ServerPackets.GameFlag,
      [...this.storage.mainConnectionIdList]
    );
  }

  onPlayerDropFlag(playerId: PlayerId): void {
    this.onPlayerLostFlag(playerId, true);
  }

  /**
   * Player /drop the flag, was killed or disconnected.
   *
   * @param playerId
   * @param isDropped
   */
  onPlayerLostFlag(playerId: PlayerId, isDropped = false): void {
    const player = this.storage.playerList.get(playerId);
    const flag = this.flag;

    if (this.helpers.isPlayerConnected(playerId)) {
      if (!player.planestate.flagspeed) {
        return;
      }
      player.planestate.flagspeed = false;
      flag.position.x = player.position.x;
      flag.position.y = player.position.y;
    } 

    flag.owner.previous = playerId;
    flag.owner.current = 0;
    flag.owner.lastDrop = Date.now();
    flag.flagstate.returned = false;
    flag.flagstate.captured = false;
    flag.flagstate.dropped = isDropped;

    flag.hitbox.x = ~~flag.position.x + MAP_SIZE.HALF_WIDTH + this.storage.flagHitboxesCache.x;
    flag.hitbox.y = ~~flag.position.y + MAP_SIZE.HALF_HEIGHT + this.storage.flagHitboxesCache.y;
    flag.hitbox.height = this.storage.flagHitboxesCache.height;
    flag.hitbox.width = this.storage.flagHitboxesCache.width;

    flag.hitbox.current.x = flag.hitbox.x - this.storage.flagHitboxesCache.x;
    flag.hitbox.current.y = flag.hitbox.y - this.storage.flagHitboxesCache.y;

    this.emit(BROADCAST_PLAYER_UPDATE, playerId);
    this.emit(
      CONNECTIONS_SEND_PACKETS,
      {
        c: SERVER_PACKETS.GAME_FLAG,
        type: CTF_FLAG_STATE.STATIC,
        flag: 2,  //1=blu 2=red
        id: flag.owner.current,
        posX: flag.position.x,
        posY: flag.position.y,
        blueteam: 0,
        redteam: 0,
      } as ServerPackets.GameFlag,
      [...this.storage.mainConnectionIdList]
    );
  }

  /**
   * Check for invalid flags state.
   */
  checkFlagsState(): void {
    const redFlag = this.flag;
        
    if (redFlag.owner.current !== 0 && !this.helpers.isPlayerConnected(redFlag.owner.current)) {
      redFlag.owner.current = 0;
      redFlag.flagstate.captured = false;
      redFlag.owner.lastDrop = Date.now();

      this.emit(
        CONNECTIONS_SEND_PACKETS,
        {
          c: SERVER_PACKETS.GAME_FLAG,
          type: CTF_FLAG_STATE.STATIC,
          flag: 2,//flagTeam,  //1=blu 2=red
          id: 0,
          posX: redFlag.position.x,
          posY: redFlag.position.y,
          blueteam: 0,
          redteam: 0,
        } as ServerPackets.GameFlag,
        [...this.storage.mainConnectionIdList]
      );            
    }
  }

  /**
   * 
   */
  updateScore(): void {
    const redFlag = this.flag;
    if (redFlag.owner.current) {
      const player = this.storage.playerList.get(redFlag.owner.current);
      player.score.current += 200;
      this.emit(RESPONSE_SCORE_UPDATE, player.id.current);
    }
  }
}
