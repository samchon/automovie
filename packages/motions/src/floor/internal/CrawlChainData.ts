import type { AutoMovieHumanoidBone } from "@automovie/interface";

export namespace CrawlChainData {
  /*
   * Upright lengths and lateral places read by this chain's preparation.
   */
  export const MEASURED: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperArm",
    "rightUpperArm",
    "leftUpperLeg",
    "rightUpperLeg",
    "leftLowerLeg",
    "rightLowerLeg",
  ]);
}
