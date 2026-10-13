import { HUMAN_HAIR_SHADOW_BETA } from "./HUMAN_HAIR_SHADOW_BETA.js";

/** Chiang et al.'s eq. 9 denominator at the model's azimuthal roughness. */
export const HUMAN_HAIR_SHADOW_ABSORPTION_SCALE =
  5.969 -
  0.215 * HUMAN_HAIR_SHADOW_BETA +
  2.532 * HUMAN_HAIR_SHADOW_BETA ** 2 -
  10.73 * HUMAN_HAIR_SHADOW_BETA ** 3 +
  5.574 * HUMAN_HAIR_SHADOW_BETA ** 4 +
  0.245 * HUMAN_HAIR_SHADOW_BETA ** 5;
