import { CTF_CAPTURE_BOUNTY, CTF_TEAMS, MOB_TYPES, SERVER_CUSTOM_TYPES, SERVER_MESSAGE_TYPES, SERVER_PACKETS, ServerPackets } from '@airbattle/protocol';
import { Circle, Polygon } from 'collisions';
import {
  COLLISIONS_OBJECT_TYPES,
  CTF_COUNTDOWN_DURATION_MS,
  CTF_WIN_ALERT_DURATION_SEC,
  MAP_SIZE,
  MAPS,
  MS_PER_SEC,
} from '../../constants';
import {
  BROADCAST_PLAYER_UPDATE,
  BROADCAST_SERVER_MESSAGE,
  COLLISIONS_ADD_OBJECT,
  COLLISIONS_REMOVE_OBJECT,
  CONNECTIONS_SEND_PACKETS,
  CTF_PLAYER_CROSSED_FLAGZONE,
  CTF_SHUFFLE_PLAYERS,
  PLAYERS_BEFORE_REMOVE,
  PLAYERS_CREATED,
  PLAYERS_RESPAWN,
  RESPONSE_SCORE_UPDATE,
  TIMELINE_CLOCK_SECOND,
  TIMELINE_GAME_MODE_START,
  TIMELINE_LOOP_TICK,
} from '../../events';
import Hitbox from '../../server/components/hitbox';
import Id from '../../server/components/mob-id';
import Position from '../../server/components/position';
import Rotation from '../../server/components/rotation';
import Team from '../../server/components/team';
import Entity from '../../server/entity';
import { System } from '../../server/system';
import { has } from '../../support/objects';
import { Flag, FlagZone, MainConnectionId, MobId, Player, PlayerId } from '../../types';

const MAX_CONTROLPOINTS = 6;
export const RADIUS = 300;
const DEFAULT_END_SCORE = 60*60*10;
const DEFAULT_END_PROGRESS = 600;

// how long to capture a controlpoint
let END_PROGRESS;
    // relation between time to capture and progress:
    // 1s -> 60
    // 5s -> 300
    // 10s -> 600
// score to win
let END_SCORE;
    //eg. 60*60*5 = holding 5 points for 60 seconds or holding 1 point for 5 minutes (etc.)


// used to smuggle values inside MOB_UPDATE_STATIONARY
function storeIntegers(int2, int14a, int14b) {
  // if (int2 < -2 || int2 > 1) throw new Error("2-bit integer out of range");
  // if (int14a < -8192 || int14a > 8191) throw new Error("14-bit integer out of range");
  // if (int14b < -8192 || int14b > 8191) throw new Error("14-bit integer out of range");
  const unsignedInt2 = (int2 + 2) & 0b11; // 2-bit
  const unsignedInt14a = (int14a + 8192) & 0x3FFF; // 14-bit
  const unsignedInt14b = (int14b + 8192) & 0x3FFF; // 14-bit
  const packedInt = (unsignedInt2 & 0b11) | 
                    ((unsignedInt14a & 0x3FFF) << 2) | 
                    ((unsignedInt14b & 0x3FFF) << 16);
  const floatArray = new Float32Array(1);
  const intArray = new Int32Array(floatArray.buffer);
  intArray[0] = packedInt;
  return floatArray[0];
}


export default class Controlpoints extends System {
  private timeout = 0

  constructor({ app }) {
    super({ app });

    this.listeners = {
      [TIMELINE_GAME_MODE_START]: this.onGameModeStart,
      [TIMELINE_CLOCK_SECOND]: this.onSecondTick,
      'CONQUEST_CONTROLPOINT_UPDATE': this.onUpdateControlpoint, //see collisions.ts
      //[CTF_PLAYER_CROSSED_FLAGZONE]: this.onPlayerCrossedDropZone,
      [TIMELINE_LOOP_TICK]: this.onTick,
      [PLAYERS_CREATED]: this.announceMatchState,
      ["MAP_CHANGED"]: this.onMapChanged,
    };
  }

  override onStop() {
    // remove collisions
    const controlpoints = MAPS[this.config.server.mapId].objects.controlpoints;
    for (let i=0; i < controlpoints.length; i++) {
      const zone = this.storage.conquestZones[i];
      zone.hitbox.current.isCollideWithPlayer = false;
      this.emit(COLLISIONS_REMOVE_OBJECT, zone.hitbox.current);
    }
  }

  onGameModeStart() {
    if (!this.storage.conquestZones.length) {
      this.initControlpoints();
    }
    this.resetControlpoints();
    this.addCollisions();
    // it is not necessary to call onUpdateControlpoint, because it will be called in onSecondTick

    END_SCORE = MAPS[this.config.server.mapId].extra?.conquest_end_score || DEFAULT_END_SCORE;
    END_PROGRESS = MAPS[this.config.server.mapId].extra?.conquest_end_progress || DEFAULT_END_PROGRESS;
  }

  addCollisions() {
    const controlpoints = MAPS[this.config.server.mapId].objects.controlpoints;
    for (let i=0; i < controlpoints.length; i++) {
      const zone = this.storage.conquestZones[i];
      zone.hitbox.current.isCollideWithPlayer = true;
      this.emit(COLLISIONS_ADD_OBJECT, zone.hitbox.current);
    }
  }

  resetControlpoints() {
    const controlpoints = MAPS[this.config.server.mapId].objects.controlpoints;
    for (let i=0; i < controlpoints.length; i++) {
      const zone = this.storage.conquestZones[i];
      const radius = RADIUS;
      const [x, y, w, h] = [controlpoints[i][0], controlpoints[i][1], radius*2, radius*2];
      zone.position.x = x;
      zone.position.y = y;
      zone.hitbox.x = x + MAP_SIZE.HALF_WIDTH - radius;
      zone.hitbox.y = y + MAP_SIZE.HALF_HEIGHT - radius;
      zone.hitbox.width = w;
      zone.hitbox.height = h;
      zone.hitbox.current.x = zone.hitbox.x + radius;
      zone.hitbox.current.y = zone.hitbox.y + radius;
    }
  }    

  onMapChanged() {
    // remove previous map collisions
    for (let zone of this.storage.conquestZones) {
      if (zone.hitbox.current.isCollideWithPlayer) {
        zone.hitbox.current.isCollideWithPlayer = false;
        this.emit(COLLISIONS_REMOVE_OBJECT, zone.hitbox.current);
      }
    }
    // re-add collisions based on new map controlpoints
    this.addCollisions();

    this.resetControlpoints();

    const controlpoints = MAPS[this.config.server.mapId].objects.controlpoints;
    for (let i=0; i < controlpoints.length; i++) {
      const zone = this.storage.conquestZones[i];
      zone.progress = 0;
      zone.netplayers = 0;
      zone.team = 0;
      this.onUpdateControlpoint(zone, null, 97);
    }

    END_SCORE = MAPS[this.config.server.mapId].extra?.conquest_end_score || DEFAULT_END_SCORE;
    END_PROGRESS = MAPS[this.config.server.mapId].extra?.conquest_end_progress || DEFAULT_END_PROGRESS;
  }

  initControlpoints(): void {
    // pre-allocate all possible controlpoints (use isCollideWithPlayer to check which is actually used)
    for (let i=0; i < MAX_CONTROLPOINTS; i++) {
      const radius = RADIUS;
      const [x, y, w, h] = [0, 0, radius*2, radius*2];

      const zone = new Entity().attach(
        new Hitbox(),
        //new Id(this.helpers.createServiceMobId()),
        new Id(i), //use reserved id (see SERVER_MIN_SERVICE_MOB_ID) (TODO: explain why)
        new Position(x, y),
        new Team(CTF_TEAMS.BLUE)
      );
      zone.netplayers = 0;//#reds - #blues inside
      zone.progress = 0;// 100:blue   -100:red
      zone.team = 0;// 0/1(blue)/2(red)

      zone.hitbox.x = x + MAP_SIZE.HALF_WIDTH - radius;
      zone.hitbox.y = y + MAP_SIZE.HALF_HEIGHT - radius;
      zone.hitbox.width = w;
      zone.hitbox.height = h;

      zone.hitbox.current = new Circle(
        zone.hitbox.x + radius,
        zone.hitbox.y + radius,
        radius
      );

      zone.hitbox.current.id = zone.id.current;
      zone.hitbox.current.type = COLLISIONS_OBJECT_TYPES.FLAGZONE;
      zone.hitbox.current.isCollideWithPlayer = false;

      //this.emit(COLLISIONS_ADD_OBJECT, zone.hitbox.current);
      this.storage.mobList.set(zone.id.current, zone);
      this.storage.conquestZones[i] = zone;

      this.log.debug('Controlpoint added.');
    }
  }

  onSecondTick(): void {
    if (!this.storage.gameEntity.match.isActive) {
      this.timeout += 1;

      const duration = 20;

      if (this.timeout === 5) {
        this.emit(
          BROADCAST_SERVER_MESSAGE,
          'Game starting in 15 seconds',
          SERVER_MESSAGE_TYPES.ALERT,
          5 * MS_PER_SEC
        );
      } else if (this.timeout === 10) {
        this.emit(
          BROADCAST_SERVER_MESSAGE,
          'Game starting in 10 seconds',
          SERVER_MESSAGE_TYPES.ALERT,
          4 * MS_PER_SEC
        );
      } else if (this.timeout >= 15 && this.timeout < duration) {
        const left = duration - this.timeout;
        let text = 'Game starting in a second';

        if (left !== 1) {
          text = `Game starting in ${duration - this.timeout} seconds`;
        }

        this.emit(
          BROADCAST_SERVER_MESSAGE,
          text,
          SERVER_MESSAGE_TYPES.ALERT,
          CTF_COUNTDOWN_DURATION_MS
        );
      } else if (
        this.timeout >= duration ||
        (this.storage.gameEntity.match.blue === 0 && this.storage.gameEntity.match.red === 0)
      ) {
        this.emit(
          BROADCAST_SERVER_MESSAGE,
          'Game starting!',
          SERVER_MESSAGE_TYPES.INFO,
          5 * MS_PER_SEC
        );

        this.storage.gameEntity.match.current += 1;
        this.storage.gameEntity.match.isActive = true;
        this.storage.gameEntity.match.start = Date.now();
        this.storage.gameEntity.match.blue = 0;
        this.storage.gameEntity.match.red = 0;
        this.storage.gameEntity.match.winnerTeam = 0;
        this.timeout = 0;

        const controlpoints = MAPS[this.config.server.mapId].objects.controlpoints;
        for (let i=0; i < controlpoints.length; i++) {
          const zone = this.storage.conquestZones[i];
          zone.progress = 0;
          zone.netplayers = 0;
          zone.team = 0;
          this.onUpdateControlpoint(zone, null, 98);
        }

        const playersIterator = this.storage.playerList.values();
        let player: Player = playersIterator.next().value;

        while (player !== undefined) {
          player.delayed.RESPAWN = true;
          player.times.activePlayingBlue = 0;
          player.times.activePlayingRed = 0;
          player.kills.currentmatch = 0;

          this.emit(PLAYERS_RESPAWN, player.id.current);

          player = playersIterator.next().value;
        }

        // this.emit(TIMELINE_GAME_MATCH_START);
        // this.emit(SCOREBOARD_FORCE_UPDATE);
      }
    }
  }

  // type: 97, 98, 99: horrible hack to avoid changing protocol, see also client Games.js (TODO)
  onUpdateControlpoint(zone, playerId: PlayerId = null, type=99) {
    if (!this.storage.gameEntity.match.isActive)
      return;
  
    if (zone.progress === 0 && zone.team !== 0)
      zone.team = 0;
    else if (zone.progress >= END_PROGRESS && zone.team !== 2)
      zone.team = 2;
    else if (zone.progress <= -END_PROGRESS && zone.team !== 1)
      zone.team = 1;

    let recipients;
    if (playerId !== null) {
      if (this.storage.playerMainConnectionList.has(playerId)) {
        recipients = this.storage.playerMainConnectionList.get(playerId);
      } else {
        return;
      }
    } else {
      recipients = [...this.storage.mainConnectionIdList];
    }

    this.emit(
      CONNECTIONS_SEND_PACKETS,
      {
        c: SERVER_PACKETS.MOB_UPDATE_STATIONARY,
        id: zone.id.current,
        type: type as MOB_TYPES,
        posX: type === 99 ? storeIntegers(0, Math.floor(this.storage.gameEntity.match.blue/60), Math.floor(this.storage.gameEntity.match.red/60)) : zone.position.x,
        posY: type === 99 ? storeIntegers(-zone.team, zone.progress, zone.netplayers) : zone.position.y,
      } as ServerPackets.MobUpdateStationary,
      recipients
    );
  }
  
  // onPlayerCrossedDropZone(playerId: PlayerId, zoneId: MobId): void {
  //   const player = this.storage.playerList.get(playerId);
  //   const zone = this.storage.mobList.get(zoneId); //as FlagZone;
  // }

  onTick(frame: number, frameFactor: number): void {
    if (!this.storage.gameEntity.match.isActive)
      return;

    const skippedFrames = Math.round(frameFactor);
    const lastFrameCompensationFactor = frameFactor - Math.floor(frameFactor) + 1;

    const controlpoints = MAPS[this.config.server.mapId].objects.controlpoints;
    for (let frameIndex = 1; frameIndex <= skippedFrames; frameIndex += 1) {
      let compensationFactor = 1;
      if (frameIndex === skippedFrames) {
        compensationFactor = lastFrameCompensationFactor;
      }

      for (let i=0; i < controlpoints.length; i++) {
        const zone = this.storage.conquestZones[i];
        if (zone.netplayers &&
          !(zone.netplayers > 0 && zone.progress === END_PROGRESS) &&
          !(zone.netplayers < 0 && zone.progress === -END_PROGRESS)
        ) {
          zone.progress += compensationFactor * Math.sign(zone.netplayers);
          if (zone.progress > END_PROGRESS)
            zone.progress = END_PROGRESS;
          if (zone.progress < -END_PROGRESS)
            zone.progress = -END_PROGRESS;
          if (Math.round(zone.progress) === 0)
            zone.progress = 0;
          if (zone.progress === 0 || Math.abs(zone.progress) === END_PROGRESS)
            this.onUpdateControlpoint(zone);
        }

        // update game score      
        if (zone.team === 1) {
          this.storage.gameEntity.match.blue += compensationFactor;
        } else if (zone.team === 2) {
          this.storage.gameEntity.match.red += compensationFactor;
        }
      }
    }

    // trigger game end
    if (this.storage.gameEntity.match.red >= END_SCORE)
      this.storage.gameEntity.match.winnerTeam = CTF_TEAMS.RED;
    if (this.storage.gameEntity.match.blue >= END_SCORE)
      this.storage.gameEntity.match.winnerTeam = CTF_TEAMS.BLUE;
    if (this.storage.gameEntity.match.winnerTeam) {
      this.gameEnd();
    }
  }

  announceMatchState(playerId: PlayerId): void {
    const controlpoints = MAPS[this.config.server.mapId].objects.controlpoints;
    for (let i=0; i < controlpoints.length; i++) {
      const zone = this.storage.conquestZones[i];
      this.onUpdateControlpoint(zone, playerId, 97);//first send the cp position (see hack TODO comment )
      this.onUpdateControlpoint(zone, playerId);
    }
  }

  gameEnd() {
    this.storage.gameEntity.match.isActive = false;

    const playersIterator = this.storage.playerList.values();
    let player: Player = playersIterator.next().value;

    while (player !== undefined) {
      if (player.team.current === this.storage.gameEntity.match.winnerTeam) {
        player.score.current += 1000;
      }
      player = playersIterator.next().value;
    }

    //this.emit(BROADCAST_SERVER_CUSTOM, player.id.current, 0);
    this.emit(
      CONNECTIONS_SEND_PACKETS,
      {
        c: SERVER_PACKETS.SERVER_CUSTOM,
        type: SERVER_CUSTOM_TYPES.CTF,
        data: JSON.stringify({
          w: this.storage.gameEntity.match.winnerTeam,
          b: 1000,//bounty,
          t: CTF_WIN_ALERT_DURATION_SEC,
        } as ServerPackets.ServerCustomCTFData),
      } as ServerPackets.ServerCustom,
      [...this.storage.mainConnectionIdList]
    );

    //this.emit(TIMELINE_GAME_MATCH_END);
  }
}
