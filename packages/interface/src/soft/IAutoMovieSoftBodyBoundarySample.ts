import type { IAutoMovieSoftBodyResolvedAnchor } from "./IAutoMovieSoftBodyResolvedAnchor";
import type { IAutoMovieSoftBodyResolvedCapsule } from "./IAutoMovieSoftBodyResolvedCapsule";

/**
 * Complete resolved boundary supplied to simulateSoftBodyWithBoundaries at one
 * absolute step.
 */
export interface IAutoMovieSoftBodyBoundarySample {
  /** Absolute solver step. */
  step: number;
  /** Resolved hard anchors for this step. */
  anchors: readonly IAutoMovieSoftBodyResolvedAnchor[];

  /**
   * Authored moving anchors left free at this step, by particle: a corner a
   * hand has let go of, which falls with its mass until a later sample holds it
   * again. Each authored moving anchor is in `anchors` or here, never both;
   * none released when absent.
   */
  released?: readonly number[];
  /** Resolved body capsules for this step. */
  capsules: readonly IAutoMovieSoftBodyResolvedCapsule[];
}
