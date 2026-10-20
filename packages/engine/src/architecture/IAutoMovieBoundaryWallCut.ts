import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieWallOpening } from "../geometry/IAutoMovieWallOpening";

/**
 * The rectangular wall panel and cut voids one boundary's own face implies.
 *
 * Produced by `builtBoundaryWallCut`. The panel is the axis-aligned bounding rectangle of the face outline in local XY, centred on its plane. Each void bounds `outlineHull`'s straight arc-enclosing ring, which can remain non-convex, measured from the panel's lower-left corner. A profile-less opening contributes no void.
 *
 * @evidence contracts/common.md#principled-implementation Bounds the face outline in its planar frame and rotates its box midpoint into world space. Void rectangles bound the shared straight arc-envelope ring; this is a rectangular proxy under `outlineHull`'s geometric/numerical premises, rather than a convex-hull or exact curved cut.
 * @evidence contracts/common.md#clear-and-simple-design Carries the panel size, its world placement and its voids in the units `buildAutoMovieWall` consumes, with every void keyed by its opening id, so the mesh step needs no second lookup into the environment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arched or concave shapes are not approximated by fitted rectangles or segmented voids; they are handed over as their bounds, a stated kernel limit, and overlapping void bounds are left to the kernel's named refusal.
 * @evidence contracts/common.md#meaningful-documentation States the producer, that the panel bounds the outline and is centred on the face plane, how each void is bounded and measured from the panel's lower-left corner, that profile-less openings have no void, the metre units, and that `rotation` is the face's own object.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; its producer pays boundary lookup, face-outline scanning, the full opening-list scan and the summed point counts of selected opening-profile hulls. Runtime cost belongs to `builtBoundaryWallCut`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Produced on demand per boundary; the engine keeps no wall cut between calls, so a changed environment is never answered from a stale panel.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources `rotation` aliases the boundary face's quaternion inside the environment record, so mutating it edits the record; every other field is a fresh value or array the caller owns.
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
