/**
 * SpawnChunk = [width, height, x, y, chanceRatio, chanceFactor]
 *
 * x and y are top left coord.
 * chanceRation is shield/inferno spawn chance ratio [0, 1]. 0 - only infernos, 1 - only shields.
 * chanceFactor used to increase or decrease global chance value. Default is 1.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { MAP_SIZE } from "./collisions";

type ChunkWidth = number;
type ChunkHeight = number;
type ChunkX = number;
type ChunkY = number;
type ChunkTypeRatio = number;
type ChanceFactor = number;
type GridCell = [ChunkWidth, ChunkHeight, ChunkX, ChunkY, ChunkTypeRatio, ChanceFactor];

const LARGE_CHUNK = 4096;
const MEDIUM_CHUNK = LARGE_CHUNK / 2;
const SMALL_CHUNK = MEDIUM_CHUNK / 2;
const CHANCE_RATIO = 0.5;
const DEFAULT_CHANCE_FACTOR = 1;

const CTF_BASE_CR = 0.35;
const CTF_BASE_SOUTH_CR = 0.4;
const CTF_BASE_SOUTH_CF = 3;

const spawnCellChunkSize = (cellDepth: number): number => {
  switch (cellDepth) {
    case 0:
      return LARGE_CHUNK;
    case 1:
      return MEDIUM_CHUNK;
    case 2:
      return SMALL_CHUNK;
    default:
      return LARGE_CHUNK;
  }
};

const spawnCellNameToMult = (cellChar: string): number => {
  switch (cellChar) {
    case 'A':
      return -2;
    case 'B':
      return -1;
    case 'C':
      return 0;
    case 'D':
      return 1;
    default:
      return 0;
  }
};

const spawnCellX = (position: string): number => {
  const cellParts = position.split('-');
  let result = 0;

  for (let index = 0; index < cellParts.length; index += 1) {
    const cellName = cellParts[index];
    const offset = index === 0 ? -5 : -1;

    result += (~~cellName.substring(1) + offset) * spawnCellChunkSize(index);
  }

  return result;
};

const spawnCellY = (position: string): number => {
  const cellParts = position.split('-');
  let result = 0;

  for (let index = 0; index < cellParts.length; index += 1) {
    const cellName = cellParts[index];
    const offset = index === 0 ? 0 : 2;

    result += (spawnCellNameToMult(cellName.charAt(0)) + offset) * spawnCellChunkSize(index);
  }

  return result;
};

const powerupSpawnCell = (
  position: string,
  size: number,
  chanceRatio: number,
  chanceFactor = DEFAULT_CHANCE_FACTOR
): GridCell => {
  return [size, size, spawnCellX(position), spawnCellY(position), chanceRatio, chanceFactor];
};

export const MAPS = {
  vanilla: {
    width: 32768,
    height: 16384,
    bounds: {
      MIN_X: -MAP_SIZE.WIDTH / 2,
      MIN_Y: -MAP_SIZE.HEIGHT / 2,
      MAX_X: MAP_SIZE.WIDTH / 2,
      MAX_Y: MAP_SIZE.HEIGHT / 2,
    },
    mountain_objects: [
      [-14895, -4703, 60],
      [-14797, -4728, 48],
      [-14697, -4739, 48],
      [-14679, -4192, 84],
      [-14607, -5112, 108],
      [-14495, -4133, 132],
      [-14430, -5180, 108],
      [-14368, -4308, 84],
      [-14197, -5222, 144],
      [-13919, -5281, 132],
      [-13646, -5170, 84],
      [-13546, -4341, 48],
      [-13428, -4299, 108],
      [-13400, -5068, 144],
      [-13099, -5108, 132],
      [-13058, -4252, 108],
      [-12894, -4096, 84],
      [-12824, -5092, 108],
      [-12738, -4077, 84],
      [-12631, -5044, 108],
      [-12460, -4396, 108],
      [-12427, -4914, 108],
      [-12270, -4816, 84],
      [-12270, -4529, 84],
      [-12091, -4699, 108],
      [-12072, -3824, 96],
      [-11940, -4867, 108],
      [-11904, -3648, 120],
      [-11772, -4983, 84],
      [-11654, -3569, 84],
      [-11648, -3357, 108],
      [-11543, -4164, 96],
      [-11420, -3359, 108],
      [-11410, -3039, 36],
      [-11365, -4131, 120],
      [-11296, -3135, 84],
      [-11287, -4244, 60],
      [-11118, -5114, 96],
      [-10912, -1220, 60],
      [-10849, -1824, 84],
      [-10848, -1330, 108],
      [-10823, -3717, 84],
      [-10782, -2838, 96],
      [-10769, -3817, 72],
      [-10749, -1511, 72],
      [-10697, -1953, 120],
      [-10675, -5079, 108],
      [-10648, -3844, 108],
      [-10581, -2773, 132],
      [-10487, -2295, 60],
      [-10479, -2146, 108],
      [-10205, -4890, 96],
      [-10140, -3346, 96],
      [-10080, -3431, 48],
      [-10074, -1190, 108],
      [-10063, -1365, 108],
      [-10037, -1579, 108],
      [-10018, -4747, 120],
      [-9995, -1773, 108],
      [-9975, -1022, 108],
      [-9895, -1942, 120],
      [-9843, -2685, 84],
      [-9835, -910, 120],
      [-9709, -848, 120],
      [-9697, -2713, 72],
      [-9695, -2048, 120],
      [-9532, -792, 120],
      [-9530, -2695, 120],
      [-9504, -2059, 120],
      [-9413, 89, 108],
      [-9371, -2159, 72],
      [-9353, 0, 72],
      [-9348, -779, 120],
      [-9341, 470, 60],
      [-9325, -2822, 84],
      [-9278, 419, 60],
      [-9262, -2081, 132],
      [-9231, 17, 84],
      [-9180, 496, 96],
      [-9131, -784, 132],
      [-9068, -2071, 120],
      [-9065, -1444, 96],
      [-9062, -1580, 96],
      [-9061, -1292, 96],
      [-8975, 528, 120],
      [-8948, -2140, 84],
      [-8861, -2045, 132],
      [-8754, -795, 84],
      [-8654, -2083, 120],
      [-8587, -797, 120],
      [-8473, -2048, 120],
      [-8465, -5037, 84],
      [-8461, -4908, 108],
      [-8424, -856, 108],
      [-8285, 855, 72],
      [-8283, -1965, 120],
      [-8273, -7231, 60],
      [-8246, -921, 108],
      [-8230, 770, 48],
      [-8188, -1087, 96],
      [-8182, -1863, 108],
      [-8167, -1225, 60],
      [-8153, -1701, 84],
      [-8153, -1591, 60],
      [-8148, -7137, 84],
      [-7694, -1393, 120],
      [-7525, -5855, 108],
      [-7495, -6329, 60],
      [-7297, -6946, 108],
      [-7178, 2874, 48],
      [-7171, -1440, 96],
      [-7135, -1547, 84],
      [-7103, 2533, 84],
      [-7099, 2721, 96],
      [-7083, 2368, 72],
      [-7081, -2673, 60],
      [-7043, 2222, 72],
      [-7032, -2749, 72],
      [-7030, -7301, 84],
      [-7003, -2611, 108],
      [-6964, 3110, 84],
      [-6869, -4052, 96],
      [-6865, 1935, 60],
      [-6853, -7377, 108],
      [-6808, 1667, 60],
      [-6793, 1796, 96],
      [-6787, 3140, 108],
      [-6769, -7571, 108],
      [-6735, 3446, 48],
      [-6725, -4069, 72],
      [-6722, 3537, 84],
      [-6694, 1622, 96],
      [-6631, -1866, 96],
      [-6607, -4081, 60],
      [-6565, 7043, 72],
      [-6541, -2030, 84],
      [-6530, 3576, 132],
      [-6467, 7070, 108],
      [-6447, -2137, 72],
      [-6440, 6614, 84],
      [-6411, 6261, 96],
      [-6400, 6066, 84],
      [-6396, 3388, 108],
      [-6377, 5578, 84],
      [-6377, 6415, 108],
      [-6347, 5646, 84],
      [-6281, 3953, 72],
      [-6266, 4956, 72],
      [-6246, 4191, 72],
      [-6233, 5414, 108],
      [-6227, 4488, 84],
      [-6222, 4769, 84],
      [-6152, 4569, 108],
      [-6147, 3994, 132],
      [-6141, 4292, 144],
      [-6001, 2039, 96],
      [-5949, -3528, 60],
      [-5944, 1954, 60],
      [-5885, -2958, 72],
      [-5882, -3696, 96],
      [-5785, 1998, 132],
      [-5716, -2944, 108],
      [-5637, -7038, 120],
      [-5620, -3123, 72],
      [-5593, -6819, 120],
      [-5470, -7251, 156],
      [-5406, -6727, 120],
      [-5372, 5172, 60],
      [-5280, 5218, 108],
      [-5263, -6580, 120],
      [-5214, -7381, 120],
      [-5149, 3079, 72],
      [-5079, 5183, 108],
      [-5063, 5374, 108],
      [-5036, 2981, 108],
      [-5028, -6473, 120],
      [-4963, 3608, 72],
      [-4950, -7410, 168],
      [-4888, 2821, 108],
      [-4859, 3634, 120],
      [-4847, -6257, 132],
      [-4829, 2745, 108],
      [-4806, -6016, 108],
      [-4776, 3510, 48],
      [-4748, -6548, 156],
      [-4689, 4605, 108],
      [-4672, -5861, 132],
      [-4663, -6781, 120],
      [-4636, -7476, 120],
      [-4556, -6940, 120],
      [-4507, 4483, 72],
      [-4480, -5668, 120],
      [-4475, -4808, 108],
      [-4435, 4273, 108],
      [-4409, -5034, 120],
      [-4399, -7496, 108],
      [-4294, -5548, 108],
      [-4281, -5240, 120],
      [-4182, -7512, 108],
      [-4174, -6231, 84],
      [-4135, -4368, 132],
      [-4103, -5400, 120],
      [-4065, -6416, 132],
      [-4031, 3697, 84],
      [-3978, -7517, 108],
      [-3956, -5572, 120],
      [-3952, -4568, 108],
      [-3935, -6595, 120],
      [-3850, 3730, 120],
      [-3835, -6826, 132],
      [-3829, -4776, 108],
      [-3790, 3582, 108],
      [-3749, -7488, 120],
      [-3736, -5698, 144],
      [-3713, -4955, 108],
      [-3708, 3449, 72],
      [-3678, -7078, 132],
      [-3604, -7301, 132],
      [-3568, -5881, 120],
      [-3492, 2892, 72],
      [-3468, -7472, 120],
      [-3433, -6072, 120],
      [-3428, -5104, 132],
      [-3383, 2930, 108],
      [-3318, -6284, 132],
      [-3253, -7558, 132],
      [-3190, -6493, 120],
      [-3167, -5254, 108],
      [-3097, -6722, 108],
      [-3049, -6916, 120],
      [-2995, -7596, 144],
      [-2974, -5399, 132],
      [-2898, -5732, 108],
      [-2851, -5589, 132],
      [-2777, -7546, 120],
      [-2744, -5943, 132],
      [-2615, -6159, 120],
      [-2550, -6627, 108],
      [-2542, -7502, 108],
      [-2503, -6359, 168],
      [-2398, -7364, 108],
      [-2387, -6791, 108],
      [-2350, -7151, 108],
      [-2315, -6976, 96],
      [-1705, -4629, 96],
      [-1551, -4718, 60],
      [-665, -3052, 60],
      [-427, -3600, 48],
      [-392, -1669, 132],
      [-379, -3529, 72],
      [-273, -1746, 60],
      [-259, -2982, 60],
      [-252, -1504, 120],
      [-155, -3044, 84],
      [-150, -3147, 48],
      [20, -1816, 60],
      [127, -1799, 60],
      [263, -2572, 48],
      [405, -2570, 108],
      [622, -2126, 48],
      [669, -2187, 72],
      [754, -3971, 108],
      [851, -4183, 120],
      [1007, -4281, 96],
      [1009, -2308, 108],
      [1157, -2379, 84],
      [1169, -4453, 108],
      [1241, -2490, 60],
      [1310, -3547, 72],
      [1412, -3642, 60],
      [1417, -4726, 120],
      [1553, -2016, 48],
      [1568, -2869, 48],
      [1570, -2792, 72],
      [1618, -7035, 60],
      [1631, -4901, 108],
      [1637, -1972, 60],
      [1736, -1922, 60],
      [1757, -5065, 132],
      [1932, -1586, 72],
      [1977, -1678, 60],
      [2054, -5244, 108],
      [2150, -2406, 72],
      [2238, -2318, 108],
      [2254, -3301, 96],
      [2305, -5281, 108],
      [2364, -2391, 72],
      [2402, 5140, 72],
      [2449, -3385, 108],
      [2491, -2682, 72],
      [2511, 5167, 96],
      [2596, -2671, 108],
      [2609, -3483, 60],
      [2766, -5202, 96],
      [2841, 4018, 132],
      [2844, -1513, 60],
      [2872, 3863, 108],
      [2881, -1403, 108],
      [2927, -5204, 84],
      [3001, 2818, 72],
      [3099, -5193, 72],
      [3125, 2942, 132],
      [3142, 2813, 84],
      [3206, -5218, 36],
      [3206, -1464, 120],
      [3330, 2296, 132],
      [3374, -2813, 96],
      [3431, 1563, 108],
      [3524, -3340, 132],
      [3558, 2174, 108],
      [3583, -864, 96],
      [3611, 1391, 120],
      [3660, -2705, 108],
      [3661, -3589, 108],
      [3703, 2044, 48],
      [3715, -1508, 72],
      [3804, -2025, 84],
      [3849, 349, 72],
      [3860, 268, 60],
      [3956, 490, 96],
      [4073, 667, 108],
      [4083, -4033, 108],
      [4116, -1778, 108],
      [4135, 836, 120],
      [4247, -1126, 72],
      [4334, -1011, 132],
      [4336, -4105, 144],
      [4470, -2768, 96],
      [4585, -2889, 84],
      [4785, -743, 120],
      [4993, -839, 108],
      [5192, -6181, 48],
      [5224, -482, 84],
      [5235, -1238, 132],
      [5247, -3464, 108],
      [5251, -6249, 60],
      [5300, -3121, 108],
      [5309, -3665, 132],
      [5352, -3964, 108],
      [5384, -4642, 108],
      [5406, -4470, 132],
      [5419, -1346, 72],
      [5563, -4697, 108],
      [5704, -4857, 108],
      [5767, -4953, 108],
      [5863, -431, 108],
      [5896, -4967, 108],
      [6027, -560, 72],
      [6075, -5099, 96],
      [6190, -1022, 96],
      [6378, -2310, 96],
      [6467, -2811, 36],
      [6483, -2725, 72],
      [6496, -1491, 60],
      [6509, -2490, 108],
      [6602, -4591, 72],
      [6610, -2664, 108],
      [6626, -1480, 84],
      [6687, -3810, 84],
      [6763, -4582, 108],
      [6822, -2736, 108],
      [6842, -3820, 96],
      [6844, -950, 120],
      [6852, 656, 60],
      [6855, 114, 96],
      [6946, 939, 120],
      [6971, 241, 120],
      [6973, -4776, 72],
      [6980, 706, 108],
      [6991, -2885, 108],
      [7016, -4674, 108],
      [7018, -3708, 120],
      [7197, -2857, 108],
      [7207, -631, 108],
      [7216, -3865, 132],
      [7221, -1140, 60],
      [7236, -1376, 72],
      [7236, -775, 60],
      [7253, -4648, 96],
      [7262, -1263, 108],
      [7303, -468, 108],
      [7347, -1447, 108],
      [7403, -1555, 84],
      [7404, -350, 120],
      [7461, -4705, 108],
      [7514, -1568, 108],
      [7521, 425, 48],
      [7521, 512, 72],
      [7589, -305, 108],
      [7599, 389, 60],
      [7624, -1610, 96],
      [7675, -4864, 132],
      [7741, -1589, 120],
      [7790, -259, 120],
      [7873, -321, 72],
      [7949, -1594, 120],
      [8115, -940, 96],
      [8116, -1076, 96],
      [8120, -790, 96],
      [8152, -1599, 132],
      [8163, -245, 84],
      [8171, -2568, 60],
      [8222, -2412, 120],
      [8275, -229, 120],
      [8325, -2615, 120],
      [8329, -311, 84],
      [8378, -1602, 144],
      [8447, -277, 120],
      [8453, -6153, 72],
      [8508, -3710, 84],
      [8510, -5322, 108],
      [8543, -1661, 84],
      [8578, -6105, 96],
      [8582, -338, 84],
      [8591, 347, 72],
      [8614, -5400, 60],
      [8675, -1573, 120],
      [8680, -322, 108],
      [8704, -3873, 108],
      [8788, -4922, 132],
      [8811, -449, 108],
      [8824, -1447, 108],
      [8904, -920, 96],
      [8905, -5072, 96],
      [8910, -610, 108],
      [8922, -6173, 120],
      [8924, -1273, 108],
      [8936, -3905, 72],
      [8949, -1060, 132],
      [8954, -5229, 108],
      [8963, -803, 120],
      [9003, -5368, 60],
      [9003, -3048, 108],
      [9124, -3853, 108],
      [9161, -3119, 72],
      [9204, -2288, 108],
      [9279, -2216, 120],
      [9280, -3812, 96],
      [9308, 2417, 60],
      [9346, 392, 144],
      [9350, 2480, 84],
      [9392, 262, 108],
      [9525, -4492, 132],
      [9554, 237, 120],
      [9665, -6403, 84],
      [9670, -5547, 108],
      [9701, -4613, 108],
      [9747, -532, 96],
      [9789, 1142, 84],
      [9807, 1027, 60],
      [9834, -6369, 120],
      [9864, -5572, 132],
      [9951, -509, 120],
      [10079, -2310, 108],
      [10102, -5078, 84],
      [10162, -3207, 84],
      [10185, -522, 108],
      [10191, -5033, 84],
      [10247, -1216, 144],
      [10290, -3340, 108],
      [10309, -1421, 108],
      [10320, -2330, 120],
      [10330, 2147, 72],
      [10336, -4977, 132],
      [10363, -3514, 84],
      [10375, -1558, 96],
      [10503, 2124, 108],
      [10523, -5133, 120],
      [10667, -5250, 96],
      [10798, -5379, 60],
      [10807, -2778, 132],
      [10942, -2963, 108],
      [11162, -3830, 120],
      [11362, -3957, 108],
      [11509, -1479, 60],
      [11558, -1692, 108],
      [11592, -5261, 84],
      [11642, -1900, 84],
      [11874, -4879, 72],
      [11907, -4742, 96],
      [11980, -4582, 108],
      [12131, -4387, 132],
      [12375, -2303, 108],
      [12440, -4278, 60],
      [12446, -2487, 120],
      [12500, 2628, 60],
      [12559, -2673, 96],
      [12559, -1120, 60],
      [12591, -4252, 96],
      [12613, -1181, 48],
      [12637, 2659, 84],
      [12743, -4826, 48],
      [12777, -4244, 108],
      [12854, -4782, 108],
      [12969, -4227, 108],
      [12989, -1929, 72],
      [13188, 2864, 60],
      [13204, -4228, 120],
      [13262, 2899, 60],
      [13487, 5738, 84],
      [13539, 5664, 60],
      [13743, 5248, 84],
      [13777, 5168, 60],
      [14366, -4493, 108],
      [14407, -3335, 108],
      [14477, -4437, 120],
      [14550, -3462, 108],
      [15305, -4230, 108],
      [15349, -5009, 48],
      [15407, 6702, 72],
      [15453, -4984, 84],
      [15481, -4283, 108],
      [15482, 6600, 48],
      [15591, 6525, 36],
      [15660, 6474, 48],
      [15681, -4973, 120],
      [15709, 6399, 48],
      [15897, -5071, 108],
      [16001, 6015, 72],
      [16017, 6110, 48],
    ],
    objects: {
      "bases": [
        null,
        [-9670, -1470],
        [8600, -940],
      ],
      firewall: {
        "position": { "MIN_X": 0, "MIN_Y": -2800, "MAX_X": 1200, "MAX_Y": -1800 },
        "initial_radius": 17000,
        "speed": 70
      }
    },
    players_spawn_zones: {
      "FFA": [
          { "MIN_X": -1024, "MAX_X": 3072, "MIN_Y": -4608, "MAX_Y": -512 }, //europe
          { "MIN_X": -11264, "MAX_X": -8192, "MIN_Y": -5632, "MAX_Y": -1536 }, //canada
          { "MIN_X": -8192, "MAX_X": -4096, "MIN_Y": 2560, "MAX_Y": 6656 }, //latam
          { "MIN_X": 4096, "MAX_X": 8192, "MIN_Y": -3072, "MAX_Y": 1024 } //asia
      ],
      "BTR": [
          { "MIN_X": -120, "MIN_Y": -4500, "MAX_X": 2960, "MAX_Y": -960 }, //waiting
          { "MIN_X": -13384, "MIN_Y": -6192, "MAX_X": 13384, "MAX_Y": 6192 } //start
      ],
      "CTF":[
          null,
          { "X": -8880, "Y": -2970 }, //blue
          { "X": 7820, "Y": -2930 } //red
      ]
    },
    powerups: {
      periodic: [],

      /**
       * Default powerups grid.
       *
       * Large chunks
       *    1  2  3  4  5  6  7  8
       * A [] [] [] [] [] [] [] []
       * B [] [] [] [] [] [] [] []
       * C [] [] [] [] [] [] [] []
       * D [] [] [] [] [] [] [] []
       */
      defaultGrid: [
        powerupSpawnCell('A1', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A2', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A3', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A4', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A5', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A6', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A7', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A8', LARGE_CHUNK, CHANCE_RATIO),

        powerupSpawnCell('B1', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('B2', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('B3', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('B4', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('B5', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('B6', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('B7', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('B8', LARGE_CHUNK, CHANCE_RATIO),

        powerupSpawnCell('C1', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('C2', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('C3', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('C4', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('C5', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('C6', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('C7', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('C8', LARGE_CHUNK, CHANCE_RATIO),

        powerupSpawnCell('D1', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D2', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D3', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D4', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D5', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D6', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D7', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D8', LARGE_CHUNK, CHANCE_RATIO),
      ],

      /**
       * CTF powerups grid.
       * The grid inside and around flag bases has special config.
       *
       * Large chunks
       *    1  2  3  4  5  6  7  8
       * A [] [] [] [] [] [] [] []
       * B []       [] []       []
       * C []       [] []       []
       * D [] [] [] [] [] [] [] []
       *
       *
       *
       * Medium chunks
       *
       * Blue base
       *       1  2           1  2
       * B2-A [] []     B3-A [] []
       * B2-B []        B3-B    []
       *
       *       1  2           1  2
       * C2-A []        C3-A    []
       * C2-B [] []     C3-B [] []
       *
       * Red base
       *       1  2           1  2
       * B6-A [] []     B7-A [] []
       * B6-B []        B7-B    []
       *
       *       1  2           1  2
       * C6-A []        C7-A    []
       * C6-B [] []     C7-B [] []
       *
       *
       *
       * Small chunks
       *
       * Blue base
       *         1  2           1  2
       * B2-B2-A [] []   B3-B1-A [] []
       * B2-B2-B [] []   B3-B1-B [] []
       *
       * B2-B2-A1 and B2-B2-A2 are in-base chunks
       * B2-B2-B1 and B2-B2-B2 are south-enter chunks
       *
       *         1  2           1  2
       * C2-A2-A [] []   C3-A1-A [] []
       * C2-A2-B [] []   C3-A1-B [] []
       *
       * Red base
       *         1  2           1  2
       * B6-B2-A [] []   B7-B1-A [] []
       * B6-B2-B [] []   B7-B1-B [] []
       *
       *         1  2           1  2
       * C6-A2-A [] []   C7-A1-A [] []
       * C6-A2-B [] []   C7-A1-B [] []
       *
       */
      ctfGrid: [
        powerupSpawnCell('A1', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A2', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A3', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A4', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A5', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A6', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A7', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('A8', LARGE_CHUNK, CHANCE_RATIO),

        powerupSpawnCell('B1', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('B2-A1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B2-A2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B2-B1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B2-B2-A1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B2-B2-A2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B2-B2-B1', SMALL_CHUNK, CTF_BASE_SOUTH_CR, CTF_BASE_SOUTH_CF),
        powerupSpawnCell('B2-B2-B2', SMALL_CHUNK, CTF_BASE_SOUTH_CR, CTF_BASE_SOUTH_CF),
        powerupSpawnCell('B3-A1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B3-A2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B3-B1-A1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B3-B1-A2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B3-B1-B1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B3-B1-B2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B3-B2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B4', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('B5', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('B6-A1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B6-A2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B6-B1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B6-B2-A1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B6-B2-A2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B6-B2-B1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B6-B2-B2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B7-A1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B7-A2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B7-B1-A1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B7-B1-A2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B7-B1-B1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B7-B1-B2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B7-B2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('B8', LARGE_CHUNK, CHANCE_RATIO),

        powerupSpawnCell('C1', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('C2-A1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C2-A2-A1', SMALL_CHUNK, CTF_BASE_SOUTH_CR, CTF_BASE_SOUTH_CF),
        powerupSpawnCell('C2-A2-A2', SMALL_CHUNK, CTF_BASE_SOUTH_CR, CTF_BASE_SOUTH_CF),
        powerupSpawnCell('C2-A2-B1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C2-A2-B2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C2-B1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C2-B2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C3-A1-A1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C3-A1-A2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C3-A1-B1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C3-A1-B2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C3-A2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C3-B1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C3-B2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C4', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('C5', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('C6-A1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C6-A2-A1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C6-A2-A2', SMALL_CHUNK, CTF_BASE_SOUTH_CR, CTF_BASE_SOUTH_CF),
        powerupSpawnCell('C6-A2-B1', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C6-A2-B2', SMALL_CHUNK, CTF_BASE_SOUTH_CR, CTF_BASE_SOUTH_CF),
        powerupSpawnCell('C6-B1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C6-B2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C7-A1-A1', SMALL_CHUNK, CTF_BASE_SOUTH_CR, CTF_BASE_SOUTH_CF),
        powerupSpawnCell('C7-A1-A2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C7-A1-B1', SMALL_CHUNK, CTF_BASE_SOUTH_CR, CTF_BASE_SOUTH_CF),
        powerupSpawnCell('C7-A1-B2', SMALL_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C7-A2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C7-B1', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C7-B2', MEDIUM_CHUNK, CTF_BASE_CR),
        powerupSpawnCell('C8', LARGE_CHUNK, CHANCE_RATIO),

        powerupSpawnCell('D1', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D2', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D3', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D4', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D5', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D6', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D7', LARGE_CHUNK, CHANCE_RATIO),
        powerupSpawnCell('D8', LARGE_CHUNK, CHANCE_RATIO),
      ],
    },
  },
};

export async function loadMaps(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const mapId = entry.name;
      const jsonPath = path.join(directory, `${mapId}/map.json`);
      const data = await fs.readFile(jsonPath, 'utf8');
      try {
        const {bounds, walls, objects, players_spawn_zones, extra} = JSON.parse(data);
        MAPS[mapId] = {
          width: 32768,
          height: 16384,
          bounds,
          mountain_objects: walls,
          powerups: MAPS.vanilla.powerups,//todo
          objects,
          extra,
          players_spawn_zones: players_spawn_zones || MAPS.vanilla.players_spawn_zones,
        };
      } catch (e) {
        console.error(`Error parsing JSON from file ${jsonPath}: ${e}`);
        continue;
      }
      console.log(`Loaded map ${mapId}`);
    }
  }
}