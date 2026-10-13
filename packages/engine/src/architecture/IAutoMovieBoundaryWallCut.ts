import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieWallOpening } from "../geometry/IAutoMovieWallOpening";

/**
 * The rectangular wall panel and cut voids one boundary's own face implies.
 *
 * Produced by `builtBoundaryWallCut`. The panel is the axis-aligned bounding
 * rectangle of the face outline in the face's local XY, centred on the face
 * plane; each void is the bounding rectangle of its opening profile's convex
 * hull, measured from the panel's lower-left corner. Openings on the boundary
 * that declare no profile have no void here.
 *
 * @evidence contracts/common.md#principled-implementation The panel is the axis-aligned bounds of the face outline in the face's own planar frame, centred by rotating the bounds' midpoint into world space, and each void is the bounds of its profile's convex hull, which is exactly the rectangle a rectangular kernel can cut.
 * @evidence contracts/common.md#clear-and-simple-design Carries the panel size, its world placement and its voids in the units `buildAutoMovieWall` consumes, with every void keyed by its opening id, so the mesh step needs no second lookup into the environment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arched or concave shapes are not approximated by fitted rectangles or segmented voids; they are handed over as their bounds, a stated kernel limit, and overlapping void bounds are left to the kernel's named refusal.
 * @evidence contracts/common.md#meaningful-documentation States the producer, that the panel bounds the outline and is centred on the face plane, how each void is bounded and measured from the panel's lower-left corner, that profile-less openings have no void, the metre units, and that `rotation` is the face's own object.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; the outline bounds and one hull per opening are computed by `builtBoundaryWallCut`, whose cost is linear in the outline and in the environment's opening list.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Produced on demand per boundary; the engine keeps no wall cut between calls, so a changed environment is never answered from a stale panel.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources `rotation` aliases the boundary face's quaternion inside the environment record, so mutating it edits the record; every other field is a fresh value or array the caller owns.
 * @author Samchon
 */
export interface IAutoMovieBoundaryWallCut {
  /** Panel extent along the boundary's local X, in metres. */
  width: number;

  /** Panel extent along the boundary's local Y, in metres. */
  height: number;

  /** Panel extent along local Z: the face thickness, in metres. */
  depth: number;

  /** World position of the panel's own centre, on the face plane. */
  origin: IAutoMovieVector3;

  /** World rotation of the panel, the boundary face's own rotation object. */
  rotation: IAutoMovieQuaternion;

  /** Kernel voids, each keyed by the architectural opening that declared it. */
  openings: IAutoMovieWallOpening[];
}
