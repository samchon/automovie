import type { V3 } from "../geometry/V3.ts";

/**
 * Records a cardinal ray's measured intersection with a source contour.
 * Its semantic name comes from the registered rig frame, not clinical palpation.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Stores the actual source-edge intersection and closed-contour arclength fraction used by fitting.
 * @evidence contracts/common.md#clear-and-simple-design One record carries the correspondence shared by observation and fitting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no source vertex index, guessed nail border or clinical landmark assertion.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes rig-based meaning, physical coordinates, phase and normalized arclength.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data interface coordinates no requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data interface acquires no resources.
 */
export interface HandPin {
  /** Cardinal anatomical direction inferred from the registered rig marker. */
  semantic: "dorsal" | "radial" | "palmar" | "ulnar";

  /** Fraction of closed contour arclength, measured from its stored first point. */
  fraction: number;

  /** Source surface intersection in the manifest's world frame, in millimetres. */
  p: V3;

  /** Ray phase in the declared section plane, degrees from minus v toward plus u. */
  phaseDeg: number;
}
