import {
  IAutoMoviePlantingBranch,
  IAutoMoviePlantingLeaf,
  IAutoMovieSoftBounds,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";

/**
 * Enclose emitted recipe-local stems and leaf cards for installation containment.
 *
 * Stem endpoints carry radial support perpendicular to their axis. The larger authored end radius covers both the declared taper and the viewer's averaged cylinder.
 *
 * Leaves use the viewer's unit XY card transformed by their emitted scale, rotation and translation; local Z scale does not thicken that card.
 *
 * @evidence contracts/common.md#principled-implementation Cylinder radial support on coordinate axis i is r*sqrt(1-u_i*u_i); endpoints bound axial support. The maximum end radius conservatively encloses the declared taper and averaged cylinder. Four transformed unit-card corners exactly bound each planar leaf under the emitted rigid transform, subject to binary64 arithmetic and finite generated geometry.
 * @evidence contracts/common.md#clear-and-simple-design The growth owner measures its emitted branch/leaf records once, and installation validation transforms this complete recipe-local envelope rather than mistaking centreline endpoints for canopy coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No guessed foliage width, fixture wall margin or renderer-only clipping repairs clearance; maximum stem radius is an explicit conservative bound and a zero-length stem uses the viewer's identity/+Y cylinder axis.
 * @evidence contracts/common.md#meaningful-documentation States recipe-local ownership, taper/averaged-cylinder coverage, exact leaf-card basis, empty null result and floating representation premises; it does not certify GPU rounding or appearance.
 * @evidence contracts/performance.md#efficient-algorithms For B branches and L leaves, two endpoint supports and four transformed card corners per record take O(B+L) time with constant extra live storage and one fresh bounds result.
 * @evidence contracts/performance.md#reuse-equivalent-work The branch unit axis and three radial supports are computed once for both endpoints; emitted leaf TRS drives all four corners, and one recipe envelope serves every installation member transform without a retained cross-recipe cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The mutable extrema belong to this call and transfer only as the fresh result; temporary support/rotated-point records are discarded, and no branch/leaf input, mesh or GPU resource is retained.
 */
export function plantingCanopyBounds(
  branches: readonly IAutoMoviePlantingBranch[],
  leaves: readonly IAutoMoviePlantingLeaf[],
): IAutoMovieSoftBounds | null {
  if (branches.length === 0 && leaves.length === 0) return null;
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };

  /** Fold one point and its axis-aligned radial support into this fresh envelope. */
  const include: (point: IAutoMovieVector3, support: IAutoMovieVector3) => void = (
    point: IAutoMovieVector3,
    support: IAutoMovieVector3,
  ): void => {
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
        const offset: IAutoMovieVector3 = Quaternion.rotateVector(leaf.rotation, {
          x: (x * leaf.scale.x) / 2,
          y: (y * leaf.scale.y) / 2,
          z: 0,
        });
        const corner: IAutoMovieVector3 = {
          x: leaf.translation.x + offset.x,
          y: leaf.translation.y + offset.y,
          z: leaf.translation.z + offset.z,
        };
        include(corner, zero);
      }
  return { min, max };
}
