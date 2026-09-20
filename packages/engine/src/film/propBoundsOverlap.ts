import { IAutoMoviePropBox } from "@automovie/interface";

/**
 * Whether two axis-aligned volumes share interior space.
 *
 * Contact is not occupancy: two boxes that meet exactly on a face do not
 * overlap, which is what lets a lamp stand on a table top without the table
 * reporting that the lamp is inside it.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance propBoundsOverlap detects positive-volume intrusion between occupancy and clearance bounds without treating mere contact as blockage.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement propBoundsOverlap realizes furnishing placement clearance: Whether two axis-aligned volumes share interior space. Contact is not occupancy: two boxes that meet exactly on a face do not overlap, which is what lets a lamp stand on a table top without the table reporting that the lamp is inside it.
 */
export const propBoundsOverlap = (
  left: IAutoMoviePropBox,
  right: IAutoMoviePropBox,
): boolean =>
  left.min.x < right.max.x &&
  left.max.x > right.min.x &&
  left.min.y < right.max.y &&
  left.max.y > right.min.y &&
  left.min.z < right.max.z &&
  left.max.z > right.min.z;
