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
