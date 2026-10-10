import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * One neutral-area root whose sequence survives subsequent mask and shape changes.
 *
 * @author Samchon
 */
export interface IHumanFaceHairSampledRoot extends IHumanFaceHairRootReference {
  /** Deterministic sample sequence used for independent strand variation. */
  sequence: number;

  /** Three barycentric weights in the source triangle's original corner order. */
  weights: [number, number, number];

  /** Neutral root position, head-frame metres. */
  point: IAutoMovieVector3;

  /** Neutral outward unit direction of the original oriented triangle. */
  normal: IAutoMovieVector3;
}
