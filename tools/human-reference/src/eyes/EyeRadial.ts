import type { V3 } from "../geometry/V3.ts";

/**
 * Observes one outward skin-plane path from an auxiliary-globe aperture crossing.
 * Parallel points and arcMm arrays describe reference samples, not spline controls.
 * Arclength is measured along this section, not along a shortest surface geodesic.
 *
 * @evidence contracts/common.md#principled-implementation Carries ordered physical observations with their phase and source section, preserving the measured path parameter.
 * @evidence contracts/common.md#clear-and-simple-design Keeps one path and its cumulative arclength together for the annular consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no identity-specific constants or topology indices.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes samples from controls and section arclength from geodesic distance.
 * @evidence contracts/performance.md#efficient-algorithms This interface performs no computation; storage is linear in observed points.
 * @evidence contracts/performance.md#reuse-equivalent-work Point and arclength arrays refer to the same observation rather than independent boundary copies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the record; it acquires no external resources.
 *
 * @author Samchon
 */
export interface EyeRadial {
  /** Stable identifier of the observed source-plane section. */
  sourceSection: string;

  /** Angle in the eye's declared local frame, in degrees. */
  phaseDeg: number;

  /** Ordered native-frame source skin points in millimetres. */
  points: V3[];

  /** Cumulative section arclength in millimetres, strictly increasing from zero. */
  arcMm: number[];

  /** Exact consecutive duplicates removed without moving the observed path. */
  removedCoincidentSamples: number;
}
