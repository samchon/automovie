import { IAutoMovieSoftBodyResolvedAnchor } from "./IAutoMovieSoftBodyResolvedAnchor";
import { IAutoMovieSoftBodyResolvedCapsule } from "./IAutoMovieSoftBodyResolvedCapsule";

/** Complete moving boundary for one absolute fixed step. */
export interface IAutoMovieSoftBodyBoundarySample {
  /** Absolute solver step. */
  step: number;
  /** Resolved hard anchors for this step. */
  anchors: readonly IAutoMovieSoftBodyResolvedAnchor[];
  /** Resolved body capsules for this step. */
  capsules: readonly IAutoMovieSoftBodyResolvedCapsule[];
}
