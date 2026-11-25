import {
  IAutoMoviePlantingBranch,
  IAutoMoviePlantingLeaf,
  IAutoMovieSoftBounds,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";

/**
 * Enclose emitted recipe-local stems and leaf cards for installation
 * containment.
 *
 * Stem endpoints carry radial support perpendicular to their axis. The larger
 * authored end radius covers both the declared taper and the viewer's averaged
 * cylinder.
 *
 * Leaves use the viewer's unit XY card transformed by their emitted scale,
 * rotation and translation; local Z scale does not thicken that card.
 */
export function plantingCanopyBounds(
  branches: readonly IAutoMoviePlantingBranch[],
  leaves: readonly IAutoMoviePlantingLeaf[],
): IAutoMovieSoftBounds | null {
  if (branches.length === 0 && leaves.length === 0) return null;
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };

  /**
   * Fold one point and its axis-aligned radial support into this fresh
   * envelope.
   */
  const include: (
    point: IAutoMovieVector3,
    support: IAutoMovieVector3,
  ) => void = (point: IAutoMovieVector3, support: IAutoMovieVector3): void => {
    min.x = Math.min(min.x, point.x - support.x);
    min.y = Math.min(min.y, point.y - support.y);
    min.z = Math.min(min.z, point.z - support.z);
    max.x = Math.max(max.x, point.x + support.x);
    max.y = Math.max(max.y, point.y + support.y);
    max.z = Math.max(max.z, point.z + support.z);
  };
  for (const branch of branches) {
    const dx: number = branch.end.x - branch.start.x;
    const dy: number = branch.end.y - branch.start.y;
    const dz: number = branch.end.z - branch.start.z;
    const length: number = Math.hypot(dx, dy, dz);
    const ux: number = length === 0 ? 0 : dx / length;
    const uy: number = length === 0 ? 1 : dy / length;
    const uz: number = length === 0 ? 0 : dz / length;
    const radius: number = Math.max(branch.radiusStart, branch.radiusEnd);
    const support: IAutoMovieVector3 = {
      x: radius * Math.sqrt(Math.max(0, 1 - ux * ux)),
      y: radius * Math.sqrt(Math.max(0, 1 - uy * uy)),
      z: radius * Math.sqrt(Math.max(0, 1 - uz * uz)),
    };
    include(branch.start, support);
    include(branch.end, support);
  }
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const leaf of leaves)
    for (let x: number = -1; x <= 1; x += 2)
      for (let y: number = -1; y <= 1; y += 2) {
        const offset: IAutoMovieVector3 = Quaternion.rotateVector(
          leaf.rotation,
          {
            x: (x * leaf.scale.x) / 2,
            y: (y * leaf.scale.y) / 2,
            z: 0,
          },
        );
        const corner: IAutoMovieVector3 = {
          x: leaf.translation.x + offset.x,
          y: leaf.translation.y + offset.y,
          z: leaf.translation.z + offset.z,
        };
        include(corner, zero);
      }
  return { min, max };
}
