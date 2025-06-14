import { promises as fs } from 'fs';
import path from 'path';
import { MOB_TYPES } from '@airbattle/protocol';
import { MissileTemplate, FireTemplate } from '../types';

// TODO: make this configurable
export const DEFAULT_SHIP_TYPE = 1;

// TODO: calculate this dynamically
export const LARGEST_SHIP_TYPE = 2;

export const SPECIAL_ABILITIES = {
  BOOST: 1,
  REPEL: 2,
  STRAFE: 3,
  FIRE: 4,
  STEALTH: 5,
};

// TODO: make it configurable
export const BTR_SHIPS_TYPES_ORDER = [
  1,
  2,
  3,
  4,
];

// export const SHIPS_TYPES = {
//   PREDATOR: 1,
//   GOLIATH: 2,
//   COPTER: 3,
//   TORNADO: 4,
//   PROWLER: 5,
// };

// export const SHIPS_NAMES = {
//   1: 'Predator',
//   2: 'Goliath',
//   3: 'Mohawk',
//   4: 'Tornado',
//   5: 'Prowler',
// };

export const SHIPS_FIRE_MODES = {
  FIRE: 'fire',
  INFERNO: 'infernoFire',
};

export const SHIPS_FIRE_TYPES = {
  DEFAULT: 'default',
  SPECIAL: 'special',
};

// export const _SHIPS_ENCLOSE_RADIUS = {
//   [SHIPS_TYPES.PREDATOR]: 32,
//   [SHIPS_TYPES.GOLIATH]: 88,
//   [SHIPS_TYPES.COPTER]: 34,
//   [SHIPS_TYPES.TORNADO]: 38,
//   [SHIPS_TYPES.PROWLER]: 36,
// };

// /**
//  *
//  * @param type missile type
//  * @param x missile start X coord relative to the player position
//  * @param y missile start Y coord relative to the player position
//  * @param rot missile start rotation angle relative to the player position
//  * @param alt has or not alternative symmetrical starting place (like copter left/right fires)
//  */
// const missileTemplate = (
//   type: number,
//   x: number,
//   y: number,
//   rot: number,
//   alt = false
// ): MissileTemplate => {
//   return {
//     type,
//     x,
//     y,
//     rot,
//     alt,
//   };
// };

// /**
//  *
//  * @param def default fire template using fire key
//  * @param special fire template using special key
//  */
// const missileFireTemplate = (
//   def: MissileTemplate[] = [],
//   special: MissileTemplate[] = []
// ): FireTemplate => {
//   return {
//     [SHIPS_FIRE_TYPES.DEFAULT]: def,
//     [SHIPS_FIRE_TYPES.SPECIAL]: special,
//   };
// };

// export const _SHIPS_SPECS = {
//   [SHIPS_TYPES.PREDATOR]: {
//     name: 'raptor',

//     turnFactor: 0.065,
//     accelFactor: 0.225,
//     brakeFactor: 0.025,
//     boostFactor: 1.5,
//     infernoFactor: 0.75,

//     maxSpeed: 5.5,
//     minSpeed: 0.001,
//     flagSpeed: 5,

//     healthRegen: 0.001,
//     energyRegen: 0.008,
//     fireEnergy: 0.6,
//     specialEnergy: 0,
//     specialEnergyRegen: -0.01,
//     specialDelay: 0,

//     fireDelay: 550, // ms.
//     damageFactor: 2,
//     energyLight: 0.6,

//     collisions: [
//       [0, 5, 23],
//       [0, -15, 15],
//       [0, -25, 12],
//     ],

//     repelEnergy: 2100,

//     [SHIPS_FIRE_MODES.FIRE]: missileFireTemplate([
//       missileTemplate(MOB_TYPES.PREDATOR_MISSILE, 0, 35, 0),
//     ]),

//     [SHIPS_FIRE_MODES.INFERNO]: missileFireTemplate([
//       missileTemplate(MOB_TYPES.PREDATOR_MISSILE, -20, 5, -0.05),
//       missileTemplate(MOB_TYPES.PREDATOR_MISSILE, 0, 35, 0),
//       missileTemplate(MOB_TYPES.PREDATOR_MISSILE, 20, 5, 0.05),
//     ]),
//   },

//   [SHIPS_TYPES.GOLIATH]: {
//     name: 'spirit',

//     turnFactor: 0.04,
//     accelFactor: 0.15,
//     brakeFactor: 0.015,
//     boostFactor: 1,
//     infernoFactor: 0.75,

//     maxSpeed: 3.5,
//     minSpeed: 0.001,
//     flagSpeed: 5,

//     healthRegen: 0.0005,
//     energyRegen: 0.005,
//     fireEnergy: 0.9,
//     specialEnergy: 0.5,
//     specialEnergyRegen: 0,
//     specialDelay: 1000,

//     fireDelay: 300, // ms.
//     damageFactor: 1,
//     energyLight: 0.9,

//     collisions: [
//       [0, 0, 35],
//       [50, 14, 16],
//       [74, 26, 14],
//       [30, 8, 23],
//       [63, 22, 15],
//       [-50, 14, 16],
//       [-74, 26, 14],
//       [-30, 8, 23],
//       [-63, 22, 15],
//     ],

//     repelEnergy: 7500,

//     [SHIPS_FIRE_MODES.FIRE]: missileFireTemplate([
//       missileTemplate(MOB_TYPES.GOLIATH_MISSILE, 0, 35, 0),
//     ]),

//     [SHIPS_FIRE_MODES.INFERNO]: missileFireTemplate([
//       missileTemplate(MOB_TYPES.GOLIATH_MISSILE, -30, 0, -0.05),
//       missileTemplate(MOB_TYPES.GOLIATH_MISSILE, 0, 35, 0),
//       missileTemplate(MOB_TYPES.GOLIATH_MISSILE, 30, 0, 0.05),
//     ]),
//   },

//   [SHIPS_TYPES.COPTER]: {
//     name: 'mohawk',

//     turnFactor: 0.07,
//     accelFactor: 0.275,
//     brakeFactor: 0.025,
//     boostFactor: 1,
//     infernoFactor: 0.75,

//     maxSpeed: 6,
//     minSpeed: 0.001,
//     flagSpeed: 5,

//     healthRegen: 0.001,
//     energyRegen: 0.01,
//     fireEnergy: 0.3,
//     specialEnergy: 0,
//     specialEnergyRegen: 0,
//     specialDelay: 0,

//     fireDelay: 300,
//     damageFactor: 2.87,
//     energyLight: 0.3,

//     collisions: [
//       [0, -12, 15],
//       [0, 0, 17],
//       [0, 13, 15],
//       [0, 26, 15],
//     ],

//     repelEnergy: 1800,

//     [SHIPS_FIRE_MODES.FIRE]: missileFireTemplate([
//       missileTemplate(MOB_TYPES.COPTER_MISSILE, 15, 10, 0, true),
//     ]),

//     [SHIPS_FIRE_MODES.INFERNO]: missileFireTemplate([
//       missileTemplate(MOB_TYPES.COPTER_MISSILE, -10, 5, -0.05),
//       missileTemplate(MOB_TYPES.COPTER_MISSILE, 0, 10, 0),
//       missileTemplate(MOB_TYPES.COPTER_MISSILE, 10, 5, 0.05),
//     ]),
//   },

//   [SHIPS_TYPES.TORNADO]: {
//     name: 'tornado',

//     turnFactor: 0.055,
//     accelFactor: 0.2,
//     brakeFactor: 0.025,
//     boostFactor: 1,
//     infernoFactor: 0.75,

//     maxSpeed: 4.5,
//     minSpeed: 0.001,
//     flagSpeed: 5,

//     healthRegen: 0.001,
//     energyRegen: 0.006,
//     fireEnergy: 0.5,
//     specialEnergy: 0.9,
//     specialEnergyRegen: 0,
//     specialDelay: 0,

//     fireDelay: 500,
//     damageFactor: 4.85 / 3.1,
//     energyLight: 0.5,

//     collisions: [
//       [0, 8, 18],
//       [14, 12, 13],
//       [-14, 12, 13],
//       [0, -12, 16],
//       [0, -26, 14],
//       [0, -35, 12],
//     ],

//     repelEnergy: 2400,

//     [SHIPS_FIRE_MODES.FIRE]: missileFireTemplate(
//       [missileTemplate(MOB_TYPES.TORNADO_MISSILE, 0, 40, 0)],
//       [
//         missileTemplate(MOB_TYPES.TORNADO_SMALL_MISSILE, -15, 10, -0.05),
//         missileTemplate(MOB_TYPES.TORNADO_SMALL_MISSILE, 0, 40, 0),
//         missileTemplate(MOB_TYPES.TORNADO_SMALL_MISSILE, 15, 10, 0.05),
//       ]
//     ),

//     [SHIPS_FIRE_MODES.INFERNO]: missileFireTemplate(
//       [
//         missileTemplate(MOB_TYPES.TORNADO_MISSILE, -15, 10, -0.05),
//         missileTemplate(MOB_TYPES.TORNADO_MISSILE, 0, 40, 0),
//         missileTemplate(MOB_TYPES.TORNADO_MISSILE, 15, 10, 0.05),
//       ],
//       [
//         missileTemplate(MOB_TYPES.TORNADO_MISSILE, -30, 20, -0.06),
//         missileTemplate(MOB_TYPES.TORNADO_MISSILE, -20, 15, -0.03),
//         missileTemplate(MOB_TYPES.TORNADO_MISSILE, 0, 40, 0),
//         missileTemplate(MOB_TYPES.TORNADO_MISSILE, 20, 15, 0.03),
//         missileTemplate(MOB_TYPES.TORNADO_MISSILE, 30, 20, 0.06),
//       ]
//     ),
//   },

//   [SHIPS_TYPES.PROWLER]: {
//     name: 'prowler',

//     turnFactor: 0.055,
//     accelFactor: 0.2,
//     brakeFactor: 0.025,
//     boostFactor: 1,
//     infernoFactor: 0.75,

//     maxSpeed: 4.5,
//     minSpeed: 0.001,
//     flagSpeed: 5,

//     healthRegen: 0.001,
//     energyRegen: 0.006,
//     fireEnergy: 0.75,
//     specialEnergy: 0.6,
//     specialEnergyRegen: 0,
//     specialDelay: 1500,

//     damageFactor: 5 / 3,
//     fireDelay: 300,
//     energyLight: 0.75,

//     collisions: [
//       [0, 11, 25],
//       [0, -8, 18],
//       [19, 20, 10],
//       [-19, 20, 10],
//       [0, -20, 14],
//     ],

//     repelEnergy: 2600,

//     [SHIPS_FIRE_MODES.FIRE]: missileFireTemplate([
//       missileTemplate(MOB_TYPES.PROWLER_MISSILE, 0, 35, 0),
//     ]),

//     [SHIPS_FIRE_MODES.INFERNO]: missileFireTemplate([
//       missileTemplate(MOB_TYPES.PROWLER_MISSILE, -20, 0, -0.05),
//       missileTemplate(MOB_TYPES.PROWLER_MISSILE, 0, 35, 0),
//       missileTemplate(MOB_TYPES.PROWLER_MISSILE, 20, 0, 0.05),
//     ]),
//   },
// };


export let SHIPS_SPECS = [
  null,
  {
    name: 'raptor',
    displayName: 'Predator',

    special: SPECIAL_ABILITIES.BOOST,

    turnFactor: 0.065,
    accelFactor: 0.225,
    brakeFactor: 0.025,
    boostFactor: 1.5,
    infernoFactor: 0.75,

    maxSpeed: 5.5,
    minSpeed: 0.001,
    flagSpeed: 5,

    healthRegen: 0.001,
    energyRegen: 0.008,
    fireEnergy: 0.6,
    specialEnergy: 0,
    specialEnergyRegen: -0.01,
    specialDelay: 0,

    fireDelay: 550, // ms.
    damageFactor: 2,
    energyLight: 0.6,

    collisions: [
      [0, 5, 23],
      [0, -15, 15],
      [0, -25, 12]
    ],
    enclose_radius: 32,

    repelEnergy: 2100,

    [SHIPS_FIRE_MODES.FIRE]: {
      [SHIPS_FIRE_TYPES.DEFAULT]: [{ type: MOB_TYPES.PREDATOR_MISSILE, x: 0, y: 35, rot: 0, alt: false, }],
      [SHIPS_FIRE_TYPES.SPECIAL]: []
    },

    [SHIPS_FIRE_MODES.INFERNO]: {
      [SHIPS_FIRE_TYPES.DEFAULT]: [
        { type: MOB_TYPES.PREDATOR_MISSILE, x: -20, y: 5, rot: -0.05, alt: false, },
        { type: MOB_TYPES.PREDATOR_MISSILE, x: 0, y: 35, rot: 0, alt: false, },
        { type: MOB_TYPES.PREDATOR_MISSILE, x: 20, y: 5, rot: 0.05, alt: false, }
      ],
      [SHIPS_FIRE_TYPES.SPECIAL]: []
    }
  },

  {
    name: 'spirit',
    displayName: 'Goliath',

    special: SPECIAL_ABILITIES.REPEL,

    turnFactor: 0.04,
    accelFactor: 0.15,
    brakeFactor: 0.015,
    boostFactor: 1,
    infernoFactor: 0.75,

    maxSpeed: 3.5,
    minSpeed: 0.001,
    flagSpeed: 5,

    healthRegen: 0.0005,
    energyRegen: 0.005,
    fireEnergy: 0.9,
    specialEnergy: 0.5,
    specialEnergyRegen: 0,
    specialDelay: 1000,

    fireDelay: 300, // ms.
    damageFactor: 1,
    energyLight: 0.9,

    collisions: [
      [0, 0, 35],
      [50, 14, 16],
      [74, 26, 14],
      [30, 8, 23],
      [63, 22, 15],
      [-50, 14, 16],
      [-74, 26, 14],
      [-30, 8, 23],
      [-63, 22, 15]
    ],
    enclose_radius: 88,

    repelEnergy: 7500,

    [SHIPS_FIRE_MODES.FIRE]: {
      [SHIPS_FIRE_TYPES.DEFAULT]: [{ type: MOB_TYPES.GOLIATH_MISSILE, x: 0, y: 35, rot: 0, alt: false, }],
      [SHIPS_FIRE_TYPES.SPECIAL]: []
    },

    [SHIPS_FIRE_MODES.INFERNO]: {
      [SHIPS_FIRE_TYPES.DEFAULT]: [
        { type: MOB_TYPES.GOLIATH_MISSILE, x: -30, y: 0, rot: -0.05, alt: false, },
        { type: MOB_TYPES.GOLIATH_MISSILE, x: 0, y: 35, rot: 0, alt: false, },
        { type: MOB_TYPES.GOLIATH_MISSILE, x: 30, y: 0, rot: 0.05, alt: false, }
      ],
      [SHIPS_FIRE_TYPES.SPECIAL]: []
    }
  },

  {
    name: 'mohawk',
    displayName: 'Mohawk',

    special: SPECIAL_ABILITIES.STRAFE,

    turnFactor: 0.07,
    accelFactor: 0.275,
    brakeFactor: 0.025,
    boostFactor: 1,
    infernoFactor: 0.75,

    maxSpeed: 6,
    minSpeed: 0.001,
    flagSpeed: 5,

    healthRegen: 0.001,
    energyRegen: 0.01,
    fireEnergy: 0.3,
    specialEnergy: 0,
    specialEnergyRegen: 0,
    specialDelay: 0,

    fireDelay: 300,
    damageFactor: 2.87,
    energyLight: 0.3,

    collisions: [
      [0, -12, 15],
      [0, 0, 17],
      [0, 13, 15],
      [0, 26, 15]
    ],
    enclose_radius: 34,

    repelEnergy: 1800,

    [SHIPS_FIRE_MODES.FIRE]: {
      [SHIPS_FIRE_TYPES.DEFAULT]: [{ type: MOB_TYPES.COPTER_MISSILE, x: 15, y: 10, rot: 0, alt: true, }],
      [SHIPS_FIRE_TYPES.SPECIAL]: []
    },

    [SHIPS_FIRE_MODES.INFERNO]: {
      [SHIPS_FIRE_TYPES.DEFAULT]: [
        { type: MOB_TYPES.COPTER_MISSILE, x: -10, y: 5, rot: -0.05, alt: false, },
        { type: MOB_TYPES.COPTER_MISSILE, x: 0, y: 10, rot: 0, alt: false, },
        { type: MOB_TYPES.COPTER_MISSILE, x: 10, y: 5, rot: 0.05, alt: false, }
      ],
      [SHIPS_FIRE_TYPES.SPECIAL]: []
    }
  },

  {
    name: 'tornado',
    displayName: 'Tornado',

    special: SPECIAL_ABILITIES.FIRE,

    turnFactor: 0.055,
    accelFactor: 0.2,
    brakeFactor: 0.025,
    boostFactor: 1,
    infernoFactor: 0.75,

    maxSpeed: 4.5,
    minSpeed: 0.001,
    flagSpeed: 5,

    healthRegen: 0.001,
    energyRegen: 0.006,
    fireEnergy: 0.5,
    specialEnergy: 0.9,
    specialEnergyRegen: 0,
    specialDelay: 0,

    fireDelay: 500,
    damageFactor: 4.85 / 3.1,
    energyLight: 0.5,

    collisions: [
      [0, 8, 18],
      [14, 12, 13],
      [-14, 12, 13],
      [0, -12, 16],
      [0, -26, 14],
      [0, -35, 12]
    ],
    enclose_radius: 38,

    repelEnergy: 2400,

    [SHIPS_FIRE_MODES.FIRE]: {
      [SHIPS_FIRE_TYPES.DEFAULT]: [{ type: MOB_TYPES.TORNADO_MISSILE, x: 0, y: 40, rot: 0, alt: false, }],
      [SHIPS_FIRE_TYPES.SPECIAL]: [
        { type: MOB_TYPES.TORNADO_SMALL_MISSILE, x: -15, y: 10, rot: -0.05, alt: false, },
        { type: MOB_TYPES.TORNADO_SMALL_MISSILE, x: 0, y: 40, rot: 0, alt: false, },
        { type: MOB_TYPES.TORNADO_SMALL_MISSILE, x: 15, y: 10, rot: 0.05, alt: false, }
      ],
    },

    [SHIPS_FIRE_MODES.INFERNO]: {
      [SHIPS_FIRE_TYPES.DEFAULT]: [
        { type: MOB_TYPES.TORNADO_MISSILE, x: -15, y: 10, rot: -0.05, alt: false, },
        { type: MOB_TYPES.TORNADO_MISSILE, x: 0, y: 40, rot: 0, alt: false, },
        { type: MOB_TYPES.TORNADO_MISSILE, x: 15, y: 10, rot: 0.05, alt: false, },
      ],
      [SHIPS_FIRE_TYPES.SPECIAL]: [
        { type: MOB_TYPES.TORNADO_MISSILE, x: -30, y: 20, rot: -0.06, alt: false, },
        { type: MOB_TYPES.TORNADO_MISSILE, x: -20, y: 15, rot: -0.03, alt: false, },
        { type: MOB_TYPES.TORNADO_MISSILE, x: 0, y: 40, rot: 0, alt: false, },
        { type: MOB_TYPES.TORNADO_MISSILE, x: 20, y: 15, rot: 0.03, alt: false, },
        { type: MOB_TYPES.TORNADO_MISSILE, x: 30, y: 20, rot: 0.06, alt: false, },
      ]
    }
  },

  {
    name: 'prowler',
    displayName: 'Prowler',

    special: SPECIAL_ABILITIES.STEALTH,

    turnFactor: 0.055,
    accelFactor: 0.2,
    brakeFactor: 0.025,
    boostFactor: 1,
    infernoFactor: 0.75,

    maxSpeed: 4.5,
    minSpeed: 0.001,
    flagSpeed: 5,

    healthRegen: 0.001,
    energyRegen: 0.006,
    fireEnergy: 0.75,
    specialEnergy: 0.6,
    specialEnergyRegen: 0,
    specialDelay: 1500,

    damageFactor: 5 / 3,
    fireDelay: 300,
    energyLight: 0.75,

    collisions: [
      [0, 11, 25],
      [0, -8, 18],
      [19, 20, 10],
      [-19, 20, 10],
      [0, -20, 14]
    ],
    enclose_radius: 36,

    repelEnergy: 2600,

    [SHIPS_FIRE_MODES.FIRE]: {
      [SHIPS_FIRE_TYPES.DEFAULT]: [{ type: MOB_TYPES.PROWLER_MISSILE, x: 0, y: 35, rot: 0, alt: true, }],
      [SHIPS_FIRE_TYPES.SPECIAL]: []
    },

    [SHIPS_FIRE_MODES.INFERNO]: {
      [SHIPS_FIRE_TYPES.DEFAULT]: [
        { type: MOB_TYPES.PROWLER_MISSILE, x: -20, y: 0, rot: -0.05, alt: false, },
        { type: MOB_TYPES.PROWLER_MISSILE, x: 0, y: 35, rot: 0, alt: false, },
        { type: MOB_TYPES.PROWLER_MISSILE, x: 20, y: 0, rot: 0.05, alt: false, },
      ],
      [SHIPS_FIRE_TYPES.SPECIAL]: []
    }
  }
];


export async function loadShips(directory) {
  SHIPS_SPECS.splice(0, SHIPS_SPECS.length);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const shipId = entry.name;
      const jsonPath = path.join(directory, `${shipId}/ship.json`);
      const data = await fs.readFile(jsonPath, 'utf8');
      try {
        const specs = JSON.parse(data);
        // keep same order as before for backward compatibility
        const i = [null, 'raptor','spirit', 'mohawk', 'tornado', 'prowler'].indexOf(shipId);
        if (i !== -1)
          SHIPS_SPECS[i] = specs;
        else
          SHIPS_SPECS.push(specs);
      } catch (e) {
        console.error(`Error parsing JSON from file ${jsonPath}: ${e}`);
        continue;
      }
      console.log(`Loaded ship ${shipId}`);
    }
  }
}