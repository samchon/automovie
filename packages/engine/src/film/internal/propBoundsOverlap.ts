import { IAutoMoviePropBox } from "@automovie/interface";

/*
 * Whether two axis-aligned world volumes share interior space.
 *
 * Contact is not occupancy: two boxes that meet exactly on a face, an edge or a
 * corner do not overlap, which lets a lamp stand on a table top without the
 * table reporting that the lamp is inside it. A box flat on one axis still
 * overlaps a box whose interior strictly contains that plane, but never one
 * that only reaches it, and a `NaN` coordinate makes the answer false. The prop
 * placement gate, the building placement-overlap queries and the
 * service-network gates all judge intrusion by this one test.
 * Parameter left: One world box, in metres.
 * Parameter right: The other world box, in metres.
 * Returns: True when, on every axis, each box's minimum lies strictly below the
 * other's maximum.
 */
export function propBoundsOverlap(
  left: IAutoMoviePropBox,
  right: IAutoMoviePropBox,
): boolean {
  return (
    left.min.x < right.max.x &&
    left.max.x > right.min.x &&
    left.min.y < right.max.y &&
    left.max.y > right.min.y &&
    left.min.z < right.max.z &&
    left.max.z > right.min.z
  );
}
