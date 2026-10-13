import { IAutoMoviePropBox } from "@automovie/interface";

/**
 * Whether two axis-aligned world volumes share interior space.
 *
 * Contact is not occupancy: two boxes that meet exactly on a face, an edge or
 * a corner do not overlap, which lets a lamp stand on a table top without the
 * table reporting that the lamp is inside it. A box flat on one axis still
 * overlaps a box whose interior strictly contains that plane, but never one
 * that only reaches it, and a `NaN` coordinate makes the answer false.
 * The prop placement gate, the building placement-overlap queries and the
 * service-network gates all judge intrusion by this one test.
 *
 * @param left One world box, in metres.
 * @param right The other world box, in metres.
 * @returns True when, on every axis, each box's minimum lies strictly below
 *   the other's maximum.
 *
 * @evidence contracts/common.md#principled-implementation The separating-axis test for axis-aligned boxes, which overlap exactly when their intervals overlap strictly on all three axes; strict comparisons exclude touching faces, edges and corners by construction.
 * @evidence contracts/common.md#clear-and-simple-design One intrusion test shared by prop placement, building placement overlap and service-network clash checks, so every gate agrees on what touching means.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance is added for any caller; contact is excluded by the comparison itself, not by a tuned gap.
 * @evidence contracts/common.md#meaningful-documentation States the contact rule and why, how a flat box behaves, the `NaN` answer, who relies on it, and the frame and unit of both boxes.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: at most six comparisons, short-circuiting on the first separating axis.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate over two boxes that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads six coordinates of each box by value; it allocates nothing and holds no reference past the call.
 */
export function propBoundsOverlap (
  left: IAutoMoviePropBox,
  right: IAutoMoviePropBox,
): boolean { return left.min.x < right.max.x &&
  left.max.x > right.min.x &&
  left.min.y < right.max.y &&
  left.max.y > right.min.y &&
  left.min.z < right.max.z &&
  left.max.z > right.min.z; }
