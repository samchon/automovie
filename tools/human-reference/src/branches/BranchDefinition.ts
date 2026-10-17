import type { Plane } from "../geometry/Plane.ts";
import type { V3 } from "../geometry/V3.ts";

/**
 * Defines a physical observation window from a private source rig in millimetres.
 * Rig markers locate the window; they do not certify anatomical landmarks.
 *
 * @evidence contracts/common.md#principled-implementation Keeps a normalized cutting frame, explicit physical station interval and spatial observation bounds independent of sampled source features.
 * @evidence contracts/common.md#clear-and-simple-design One definition is consumed by ordinary cuts, critical-event observations and fixed camera framing so a mistaken feature cannot move its own window.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no source indices, reference identity coordinates or inferred product coefficients.
 * @evidence contracts/common.md#meaningful-documentation Describes millimetres, rig-marker limitations, station sign and the optional geometric corner observation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This data declaration selects no processing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This data declaration owns no computation or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This data declaration owns no acquired resource.
 * @author Samchon
 */
export interface BranchDefinition {
  /** Named source region, not a segmented product part. */
  name: "shoulder-l" | "shoulder-r" | "thigh-l" | "thigh-r" | "groin";

  /** Origin and unit axes in the source manifest's physical frame. */
  frame: Plane;

  /** Signed distance from frame.origin along frame.n, in millimetres. */
  intervalMm: [number, number];

  /** Axis-aligned observation window; clipping does not insert closing edges. */
  bounds: { low: V3; high: V3 };

  /** Rig-bounded skin extremum, without a clinical acromion interpretation. */
  corner?: V3;

  /** Conventional window definitions and unresolved source limitations. */
  limits: string[];
}
