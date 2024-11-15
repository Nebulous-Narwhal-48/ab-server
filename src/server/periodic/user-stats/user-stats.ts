import { existsSync, readFileSync, renameSync } from 'fs';
import { Worker } from 'worker_threads';
import { USER_STATS_SAVE_INTERVAL_SEC } from '../../../constants';
import {
  TIMELINE_BEFORE_GAME_START,
  TIMELINE_CLOCK_SECOND,
  USERS_WORKER_SAVE_STATS,
  USERS_WORKER_SAVE_STATS_RESPONSE,
} from '../../../events';
import { System } from '../../system';
import { FILE_FORMAT } from './user-stats-serialize';

export default class UserStatsPeriodic extends System {
  private worker: Worker;

  private seconds = 0;

  private saveInProgress = false;

  constructor({ app }) {
    super({ app });

    this.listeners = {
      [TIMELINE_BEFORE_GAME_START]: this.onBeforeGameStart,
      [TIMELINE_CLOCK_SECOND]: this.onSecondTick,
      [USERS_WORKER_SAVE_STATS_RESPONSE]: this.updateSavingStatus,
    };
  }

  onBeforeGameStart(): void {
    this.runWorker();

    const path = this.config.sync.enabled
      ? this.config.sync.state.path
      : this.config.accounts.userStats.path;

    if (existsSync(path)) {
      this.load();
    } else {
      this.save();
    }

    if (this.config.skins.enable) {
      if (existsSync(this.config.accounts.skins.path)) {
        this.load_skins();
      } else {
        this.save_skins();
      }
    }
  }

  onSecondTick(): void {
    this.seconds += 1;

    if (this.seconds >= USER_STATS_SAVE_INTERVAL_SEC) {
      const hasChanges = this.config.sync.enabled
        ? this.storage.sync.hasChanges
        : this.storage.users.hasChanges;

      if (hasChanges && !this.saveInProgress) {
        this.save();
      }

      if (this.storage.skins.hasChanges && !this.saveInProgress) {
        this.save_skins();
      }

      this.seconds = 0;
    }
  }

  renameFile(path: string, reason: string): void {
    /**
     * May be called during load. This is to avoid data loss when we have a file format we can't process.
     */
    const renamePath = `${path}.${reason}-${Date.now()}`;

    this.log.info('Renaming file "%s" to "%s"', path, renamePath);
    renameSync(path, renamePath);
  }

  load(): void {
    if (this.config.sync.enabled) {
      /**
       * Backup any user stats file.
       */
      if (existsSync(this.config.accounts.userStats.path)) {
        this.renameFile(this.config.accounts.userStats.path, 'backup');
      }

      /**
       * Load sync state.
       */
      let data;
      const { sync } = this.storage;

      try {
        const json = readFileSync(this.config.sync.state.path);

        data = JSON.parse(json.toString());
      } catch (err) {
        this.log.error('Error while loading sync state: %o', { error: err.stack });
        this.renameFile(this.config.sync.state.path, 'error');
      }

      this.log.info(
        'Loading sync state: next sequence id %d, update queue lengths %d/%d/%d/%d',
        data.nextSequenceId,
        data.updatesAwaitingSequenceId.length,
        data.updatesAwaitingSend.length,
        data.updatesAwaitingAck.length,
        data.updatesAwaitingResend.length
      );

      sync.nextSequenceId = data.nextSequenceId;
      sync.thisServerId = data.thisServerId;
      sync.thisServerEndpoint = data.thisServerEndpoint;
      sync.updatesAwaitingSequenceId = data.updatesAwaitingSequenceId;
      sync.updatesAwaitingSend = new Map(data.updatesAwaitingSend);
      sync.updatesAwaitingAck = new Map(data.updatesAwaitingAck);
      sync.updatesAwaitingResend = new Map(data.updatesAwaitingResend);
    } else {
      /**
       * Load user stats.
       */
      try {
        const data = readFileSync(this.config.accounts.userStats.path);

        this.storage.users.list = new Map(JSON.parse(data.toString()));
      } catch (err) {
        this.log.error('Error while loading user stats: %o', { error: err.stack });
        this.renameFile(this.config.accounts.userStats.path, 'error');
      }
    }
  }

  load_skins() {
    try {
      const data = readFileSync(this.config.accounts.skins.path);

      this.storage.skins.byUrl = new Map(JSON.parse(data.toString()).map(x=>[x.url, x]));

      var groupBy = function(xs, key) {
        return xs.reduce(function(rv, x) {
          (rv[x[key]] = rv[x[key]] || []).push(x);
          return rv;
        }, {});
      };
      
      this.storage.skins.byUser = new Map(Object.entries(groupBy(JSON.parse(data.toString()), "user_id")));
      
    } catch (err) {
      this.log.error('Error while loading skins: %o', { error: err.stack });
      // this.renameFile(this.config.accounts.userStats.path, 'error');
    }
  }

  /**
   * Initiate data saving task.
   */
  save(): void {
    const { sync, users } = this.storage;
    let args: [FILE_FORMAT, any];

    this.saveInProgress = true;

    if (this.config.sync.enabled) {
      /**
       * Save sync state.
       */
      args = [
        FILE_FORMAT.SYNC_STATE,
        {
          nextSequenceId: sync.nextSequenceId,
          thisServerId: sync.thisServerId,
          thisServerEndpoint: sync.thisServerEndpoint,
          updatesAwaitingSequenceId: sync.updatesAwaitingSequenceId,
          updatesAwaitingSend: [...sync.updatesAwaitingSend.entries()],
          updatesAwaitingAck: [...sync.updatesAwaitingAck.entries()],
          updatesAwaitingResend: [...sync.updatesAwaitingResend.entries()],
        },
      ];
      sync.hasChanges = false;
    } else {
      /**
       * Save user stats.
       */
      args = [FILE_FORMAT.USER_STATS, [...users.list.entries()]];
      users.hasChanges = false;
    }

    this.worker.postMessage({ event: USERS_WORKER_SAVE_STATS, args });
  }

  save_skins() {
    const { skins } = this.storage;
    console.log('save_skins', skins);
    let args: [FILE_FORMAT, any];

    this.saveInProgress = true;

    args = [FILE_FORMAT.SKINS, skins.byUrl];
    skins.hasChanges = false;

    this.worker.postMessage({ event: USERS_WORKER_SAVE_STATS, args });
  }

  updateSavingStatus(saved: boolean): void {
    this.saveInProgress = !saved;
  }

  private runWorker(): void {
    this.worker = new Worker('./dist/server/periodic/user-stats/user-stats-worker.js', {
      workerData: {
        config: this.config,
      },
    });

    this.worker.on('exit', exitCode => {
      if (exitCode !== 0) {
        this.log.fatal('Accounts worker is down: %o', { exitCode });
        process.exit(exitCode);
      }
    });

    /**
     * Re-emit events from the worker.
     */
    this.worker.on('message', msg => {
      try {
        this.events.emit(msg.event, ...msg.args);
      } catch (err) {
        this.log.error('Error re-emitting event from the accounts worker: %o', {
          event: msg.event,
        });
      }
    });

    this.worker.on('online', () => {
      this.log.debug('Accounts worker started.');
    });

    this.worker.on('error', () => {
      this.log.error('Error starting accounts worker.');
    });
  }
}
