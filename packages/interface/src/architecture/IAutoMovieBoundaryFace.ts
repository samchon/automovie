import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMoviePlanarPoint } from "./IAutoMoviePlanarPoint";

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
 * Validation checks a finite origin, a unit rotation, a positive thickness, and
 * an outline of at least three distinct finite corners enclosing area without
 * crossing itself; it does not check that `+Z` points out of the space. The
 * envelope-face derivation probes the space and flips a normal that points in.
 *
 * @evidence contracts/common.md#principled-implementation A rigid frame plus a planar outline; `validateBuiltEnvironment` checks the frame and outline, and an opening's hull must pass `polygonInside` against the outline, a plane-local containment test that works because both live in the same frame.
 * @evidence contracts/common.md#clear-and-simple-design Origin, rotation, outline and thickness are the minimum that locate a slab in space; the thickness extrudes along local `+Z`, so no second outline or depth record exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Outward orientation is not validated; `builtEnvironmentEnvelopeFaces` compensates by probing the space and flipping an inward normal, a stated limitation rather than a silent repair in the record.
 * @evidence contracts/common.md#meaningful-documentation States the frame's axis meaning, the unit, why the face is planar, the outline's simplicity rule and its reason, and exactly what validation checks and leaves to the envelope derivation.
 * @author Samchon
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
