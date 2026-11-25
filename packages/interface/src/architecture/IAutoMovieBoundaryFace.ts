import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePlanarPoint } from "./IAutoMoviePlanarPoint";

/**
 * The located planar face of a boundary and the frame openings are measured in.
 *
 * The frame is a full rigid placement, never a heading: local `+X` and `+Y`
 * span the face and local `+Z` is the outward normal, so a wall leaning out of
 * plumb or a sloping soffit is stated exactly rather than flattened to a
 * compass direction. Every opening on the boundary is written in this frame's
 * metres, so whether a door lies inside its wall is one planar containment
 * test.
 *
 * The patch is planar. A curved separation is authored as several flat
 * boundaries rather than as one face whose surface the containment test would
 * have to approximate.
 *
 * Validation checks finite origin, unit rotation, positive finite thickness, at
 * least three finite corners with consecutive spacing above 1e-9 m, finite
 * doubled area magnitude above 1e-9 and the approximate simple-ring predicate.
 * It does not check that the face borders its cited volume or `+Z` points
 * outward. Envelope derivation flips authored `+Z` only when one probe 0.001 m
 * along it from the shoelace centroid is inside the space; it does not test the
 * opposite side, and a concave outline's centroid can lie outside its patch.
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

  /** Positive separation thickness along the boundary's local `+Z`, in metres. */
  thickness: number;
}
