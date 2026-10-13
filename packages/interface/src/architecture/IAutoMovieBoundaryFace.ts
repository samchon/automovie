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
 * Validation checks a finite origin, a unit rotation, a positive thickness and
 * the outline; it does not check that `+Z` points out of the space. The
 * envelope-face derivation probes the space and flips a normal that points in.
 *
 * @evidence contracts/common.md#principled-implementation A rigid frame of origin and unit quaternion plus a simple polygon in local XY makes opening containment a 2D polygon test in face coordinates; validation requires three or more distinct finite corners, non-zero area and no self-crossing.
 * @evidence contracts/common.md#clear-and-simple-design Openings are written in the face frame rather than in world space, so one transform per boundary serves every opening on it, and curved separations are split into flat faces instead of adding a surface type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Outward `+Z` is never validated, and `builtEnvironmentEnvelopeFaces` compensates by probing the space and flipping an inward normal; `builtBoundaryWallCut` places its panel centre on the face plane, so the cut wall spans both sides instead of the documented `+Z` side.
 * @evidence contracts/common.md#meaningful-documentation States the meaning of each local axis, the metre unit and frame of the outline, the simple-polygon rule, the side the thickness extends to, and that outward orientation is unchecked.
 */
export interface IAutoMovieBoundaryFace {
  /** World-space origin of the boundary's own frame. */
  origin: IAutoMovieVector3;

  /** Unit quaternion taking the boundary's local axes into world space. */
  rotation: IAutoMovieQuaternion;

  /**
   * Closed face outline in boundary-local XY metres, at least three points.
   *
   * The outline is a simple polygon: it may be concave, but it may not cross
   * itself, because a self-crossing outline has no inside for an opening to be
   * checked against.
   */
  outline: IAutoMoviePlanarPoint[];

  /**
   * Positive separation thickness along the boundary's local `+Z`, in metres.
   */
  thickness: number;
}
