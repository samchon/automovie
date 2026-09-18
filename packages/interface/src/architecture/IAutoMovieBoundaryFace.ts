import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMoviePlanarPoint } from "./IAutoMoviePlanarPoint";

/**
 * The located planar face of a boundary and the frame openings are measured in.
 *
 * The frame is a full rigid placement, never a heading: local `+X` and `+Y`
 * span the face and local `+Z` is the outward normal, so a wall leaning out of
 * plumb or a sloping soffit is stated exactly rather than flattened to a
 * compass direction. Everything an opening says about itself is written in this
 * frame's metres, which is what makes "the door is inside the wall" a fact the
 * engine can settle instead of two unrelated coordinate systems.
 *
 * The patch is planar on purpose. A curved separation is authored as several
 * boundaries, each one flat, rather than as one face carrying a surface the
 * containment test would then have to approximate.
 *
 * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-boundary-validation Exposes `IAutoMovieBoundaryFace` as the portable data boundary for the interior wall boundary validation requirement.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-wall-partition-boundary Types `IAutoMovieBoundaryFace` for the interior space wall partition boundary system contract.
 */
export interface IAutoMovieBoundaryFace {
  /**
   * World-space origin of the boundary's own frame.
   *
   * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-boundary-validation Exposes `origin` as the portable data boundary for the interior wall boundary validation requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-wall-partition-boundary Types `origin` for the interior space wall partition boundary system contract.
   */
  origin: IAutoMovieVector3;
  /**
   * Unit quaternion taking the boundary's local axes into world space.
   *
   * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-boundary-validation Exposes `rotation` as the portable data boundary for the interior wall boundary validation requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-wall-partition-boundary Types `rotation` for the interior space wall partition boundary system contract.
   */
  rotation: IAutoMovieQuaternion;
  /**
   * Closed face outline in boundary-local XY metres, at least three points.
   *
   * The outline is a simple polygon: it may be concave, but it may not cross
   * itself, because a self-crossing outline has no inside for an opening to be
   * checked against.
   *
   * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-boundary-validation Exposes `outline` as the portable data boundary for the interior wall boundary validation requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-wall-partition-boundary Types `outline` for the interior space wall partition boundary system contract.
   */
  outline: IAutoMoviePlanarPoint[];
  /**
   * Positive separation thickness along the boundary's local `+Z`, in metres.
   *
   * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-boundary-validation Exposes `thickness` as the portable data boundary for the interior wall boundary validation requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-wall-partition-boundary Types `thickness` for the interior space wall partition boundary system contract.
   */
  thickness: number;
}
