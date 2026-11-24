import type { IAutoMovieHumanLegMassPrior } from "@automovie/interface";

/**
 * Independent posterior displacement for the shank. Gray's anatomy puts
 * gastrocnemius and soleus behind the tibial crest and the quadriceps and
 * hamstrings on opposite sides of the femur. ESTIMATE: the upper shank has one
 * third of its AP reach anterior to the tibia, returning toward the midpoint by
 * the ankle. Without a measured imbalance the thigh is centred.
 */
export namespace AutoMovieHumanLegMassPrior {
  /** Front share of the thigh's depth, from hip toward knee. */
  export const THIGH: readonly IAutoMovieHumanLegMassPrior.IRow[] = [
    { share: 1 / 4, front: 1 / 2 },
    { share: 3 / 4, front: 1 / 2 },
  ];

  /** Front share of the shank's depth, from knee toward ankle. */
  export const SHANK: readonly IAutoMovieHumanLegMassPrior.IRow[] = [
    { share: 1 / 4, front: 1 / 3 },
    { share: 3 / 4, front: 5 / 12 },
  ];

  /**
   * Move the section centre so the selected share of its depth is ahead of the
   * bone.
   */
  export function offset(front: number, ahead: number, behind: number): number {
    return front * (ahead + behind) - ahead;
  }
}
