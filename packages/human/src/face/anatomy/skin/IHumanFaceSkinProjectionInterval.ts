import type { IHumanFaceSkinProjectionFeature } from "./IHumanFaceSkinProjectionFeature";

/**
 * One interval of the quadratic nearest-distance lower envelope. The chosen
 * feature supplies the affine point and never creates a new surface edge.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionInterval {
  /** Selected native feature. */
  feature: IHumanFaceSkinProjectionFeature;

  /** Interval start in [0,1]. */
  lower: number;

  /** Interval end in [0,1]. */
  upper: number;
}
