import { HUMAN_HAIR_SHADOW_BETA } from "./HUMAN_HAIR_SHADOW_BETA.js";

/**
 * Dimensionless denominator of Chiang et al.'s equation 9 color-to-absorption
 * fit, evaluated at this viewer's conventional azimuthal roughness.
 * The fit uses simulated dense hair cubes, not measured subject anatomy.
 * See https://media.disneyanimation.com/uploads/production/publication_asset/152/asset/eurographics2016Fur_Smaller.pdf.
 * Evaluation is fixed polynomial work at module load; CPU and shader generation
 * reuse this scalar and it retains no native resource.
 */
export const HUMAN_HAIR_SHADOW_ABSORPTION_SCALE: number =
  5.969 -
  0.215 * HUMAN_HAIR_SHADOW_BETA +
  2.532 * HUMAN_HAIR_SHADOW_BETA ** 2 -
  10.73 * HUMAN_HAIR_SHADOW_BETA ** 3 +
  5.574 * HUMAN_HAIR_SHADOW_BETA ** 4 +
  0.245 * HUMAN_HAIR_SHADOW_BETA ** 5;
