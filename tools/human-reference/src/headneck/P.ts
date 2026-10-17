import type { Polyline } from "../geometry/Polyline.ts";
import type { V3 } from "../geometry/V3.ts";

/**
 * Reads ordered coordinates while preserving each source-cut point's identity.
 *
 * @evidence contracts/common.md#principled-implementation Maps the cut's existing order without geometric interpolation.
 * @evidence contracts/common.md#clear-and-simple-design This adapter exposes only positions for curve calculations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reordering, reference cases or copied geometry are present.
 * @evidence contracts/common.md#meaningful-documentation States that coordinates preserve source-cut order.
 * @evidence contracts/performance.md#efficient-algorithms One linear traversal allocates an array of N existing coordinate references.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This stateless adapter coordinates no requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned array has N references; the operation owns no handles or retained state.
 */
export function P(polyline: Polyline): V3[] {
  return polyline.pts.map((point: Polyline["pts"][number]): V3 => point.p);
}
