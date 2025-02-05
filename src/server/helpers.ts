import crypto from 'crypto';
import { ClockTime } from '@airbattle/protocol';
import { NS_PER_SEC, SERVER_MAX_MOB_ID, SERVER_MIN_MOB_ID, SERVER_MIN_MOUNTAIN_MOB_ID } from '../constants';
import Logger from '../logger';
import { AuthToken, AuthTokenData, MobId, PlayerId } from '../types';
import { GameStorage } from './storage';

/**
 * Helpers that need access to app instance.
 * Place other helpers in src/support.
 */
class Helpers {
  /**
   * Reference to game storage.
   */
  private storage: GameStorage;

  /**
   * Reference to logger.
   */
  private log: Logger;

  private enableTestAccounts: boolean;

  /**
   * Server start time.
   */
  private clockResetTime: [number, number];

  constructor({ app }) {
    this.storage = app.storage;
    this.log = app.log;
    this.enableTestAccounts = app.config.accounts.enableTestAccounts;

    this.resetClock();
  }

  /**
   * Protocol time format.
   */
  clock(): ClockTime {
    const [s, ns] = process.hrtime(this.clockResetTime);

    return Math.ceil((s * NS_PER_SEC + ns) / 10000);
  }

  /**
   * Use to prevent clock value overflow.
   */
  resetClock(): void {
    this.log.info('Reset protocol clock.');
    this.clockResetTime = process.hrtime();
  }

  isPlayerConnected(playerId: PlayerId): boolean {
    if (
      !this.storage.playerMainConnectionList.has(playerId) ||
      !this.storage.playerList.has(playerId)
    ) {
      return false;
    }

    return true;
  }

  isPlayerMuted(playerId: PlayerId): boolean {
    if (!this.storage.playerList.has(playerId)) {
      return false;
    }

    const player = this.storage.playerList.get(playerId);

    if (player.times.unmuteTime > Date.now()) {
      return true;
    }

    return false;
  }

  createServiceMobId(): MobId {
    const id = this.storage.nextServiceMobId;

    this.storage.nextServiceMobId += 1;

    if (this.storage.nextServiceMobId >= SERVER_MIN_MOUNTAIN_MOB_ID) {
      this.log.error('Service mob ID is out of range!');
    }

    return id;
  }

  createMountainMobId(): MobId {
    const id = this.storage.nextMountainMobId;

    this.storage.nextMountainMobId += 1;

    if (this.storage.nextMountainMobId >= SERVER_MIN_MOB_ID) {
      this.log.error('Mountain mob ID is out of range!');
    }

    return id;
  }

  resetMountainMobIds() {
    this.storage.nextMountainMobId = SERVER_MIN_MOUNTAIN_MOB_ID;
  }

  createMobId(playerName = ''): MobId {
    let mobId = this.storage.nextMobId;

    this.storage.nextMobId += 1;

    if (playerName.length > 0 && this.storage.playerHistoryNameToIdList.has(playerName)) {
      mobId = this.storage.playerHistoryNameToIdList.get(playerName).id;
    }

    while (this.storage.mobIdList.has(mobId)) {
      mobId = this.storage.nextMobId;
      this.storage.nextMobId += 1;
    }

    this.storage.mobIdList.add(mobId);

    if (playerName.length > 0) {
      this.storage.playerHistoryNameToIdList.set(playerName, {
        id: mobId,
        expired: Date.now(),
      });
    }

    if (this.storage.nextMobId >= SERVER_MAX_MOB_ID) {
      this.storage.nextMobId = SERVER_MIN_MOB_ID;
    }

    if (this.storage.mobIdList.size >= SERVER_MAX_MOB_ID - SERVER_MIN_MOB_ID) {
      this.log.warn('Critical amount of mobs.');
    }

    return mobId;
  }

  /**
   * For verifying authentication tokens.
   *
   * Checks the outer format and the signature.
   *
   * Does not check the token data other than ensuring it is valid JSON, this is the responsibility of the caller.
   */
  verifyToken(token: string): object {
    if (this.storage.loginPublicKey === null) {
      this.log.debug('The public key is not installed. Authentication request rejected.');

      return null;
    }

    /**
     * Token must be two base64 strings separated by a dot.
     */
    const tokenParts = token.split('.') as AuthToken;

    if (tokenParts.length !== 2) {
      this.log.debug('Wrong number of parts in authentication token.');

      return null;
    }

    /**
     * First part is data, second part is signature.
     */
    let data: Buffer;
    let signature: Buffer;
    let auth: object;

    try {
      data = Buffer.from(tokenParts[0], 'base64');
      signature = Buffer.from(tokenParts[1], 'base64');
      auth = JSON.parse(data.toString());
    } catch (e) {
      this.log.debug('Cannot parse authentication token.');

      return null;
    }

    if (typeof auth !== 'object' || auth === null) {
      this.log.debug('Decoded token data was not an object.');

      return null;
    }

    /**
     * Ed25519 signature must be exactly 64 bytes long.
     */
    if (signature.length !== 64) {
      this.log.debug('Invalid signature length in authentication token.');

      return null;
    }

    /**
     * Verify signature.
     */
    if (!crypto.verify(null, data, this.storage.loginPublicKey, signature)) {
      this.log.debug('Authentication token signature not verified.');

      return null;
    }

    /**
     * We have a correctly signed object, so return it.
     */
    return auth;
  }

  /**
   * Verify token and extract user id.
   */
  getUserIdFromToken(token: string): string {
    if (this.enableTestAccounts && token === 'a') {
      return '1';
    }
    if (this.enableTestAccounts && token === 'b') {
      return '2';
    }

    const auth = this.verifyToken(token) as AuthTokenData;

    /**
     * Check if format and signature verification failed.
     */
    if (auth === null) {
      return '';
    }

    /**
     * User id, timestamp, and purpose must be specified in token.
     */
    if (undefined === auth.uid || undefined === auth.ts || undefined === auth.for) {
      this.log.debug('Required fields not present in authentication token data.');

      return '';
    }

    /**
     * Check uid type.
     */
    if (typeof auth.uid !== 'string') {
      this.log.debug('In authentication token, uid field must be a string.');

      return '';
    }

    /**
     * Check ts type.
     */
    if (typeof auth.ts !== 'number') {
      this.log.debug('In authentication token, ts field must be a number.');

      return '';
    }

    /**
     * Purpose of token must be 'game'.
     */
    if (auth.for !== 'game') {
      this.log.debug('Authentication token purpose is incorrect.');

      return '';
    }

    return auth.uid;
  }
}

export default Helpers;
