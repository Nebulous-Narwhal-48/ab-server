import { MOB_TYPES } from '@airbattle/protocol';
import { MS_PER_SEC, SECONDS_PER_MINUTE } from './units';
import { GAME_TYPES } from './modes';

export const POWERUPS_DEFAULT_DURATION_MS = 10 * MS_PER_SEC;

export const POWERUPS_DEFAULT_DESPAWN_MS = 5 * SECONDS_PER_MINUTE * MS_PER_SEC;

export const POWERUPS_RESPAWN_TIMEOUT_MS = 5 * SECONDS_PER_MINUTE * MS_PER_SEC;

export const POWERUPS_SPAWN_GUARANTEED_SEC = 30 * SECONDS_PER_MINUTE;

export const POWERUPS_SPAWN_CHANCE = 0.02;

export const POWERUPS_SPAWN_LIMIT = 0.1;

export const POWERUPS_DEFAULT_SPAWN_CHANCE = {
  [GAME_TYPES.FFA]: 0.5,
  [GAME_TYPES.CTF]: 0.02,
  [GAME_TYPES.BTR]: 0.5,
  [GAME_TYPES.CON]: 0.5,
};

export const POWERUPS_DEFAULT_SPAWN_LIMIT = {
  [GAME_TYPES.FFA]: 0.4,
  [GAME_TYPES.CTF]: 0.05,
  [GAME_TYPES.BTR]: 0.25,
  [GAME_TYPES.CON]: 0.4,
};

export const POWERUPS_COLLISIONS = {
  [MOB_TYPES.UPGRADE]: [[0, 0, 24]],
  [MOB_TYPES.INFERNO]: [[0, 0, 24]],
  [MOB_TYPES.SHIELD]: [[0, 0, 24]],
};
