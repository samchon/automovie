import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { HandPin } from "./HandPin.ts";

/**
 * Extends a measured contour with optional rig-frame correspondence observations.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Preserves the source contour and adds observations rather than replacing it with a fitted curve.
 * @evidence contracts/common.md#clear-and-simple-design Extends the shared contour record without a duplicate geometry representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not make a pin mandatory when its ray has no valid source crossing.
 * @evidence contracts/common.md#meaningful-documentation Optional pins mean observed cardinal intersections, not inferred missing boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data interface coordinates no requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data interface acquires no resources.
 */
export interface HandLoop extends LoopRecord {
  /** Present only on selected contours with source-supported cardinal crossings. */
  featurePins?: HandPin[];
}
