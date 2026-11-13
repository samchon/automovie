import type { IAutoMovieViewerSubjectLens } from "./IAutoMovieViewerSubjectLens.js";

/**
 * Inspection eye and target in world metres, with perspective lens and positive ordered clip distances. Pose application currently requires an unparented camera or an identity parent transform.
 *
 * @evidence contracts/development/design.md#principled-representation A look-at target plus explicit lens/clips defines a perspective camera without film time; finite admitted coordinates and a noncoincident eye/target remain caller premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separates pose construction from mutable camera application and encoded image capture.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not validate ranges or distinguish local from transformed-parent camera coordinates at runtime.
 * @evidence contracts/development/common.md#meaningful-documentation States frame, units, clip ordering and the camera parent limitation.
 */
export interface IAutoMovieViewerSubjectPose {
  /**
   * World position of the eye, in metres.
   */
  position: { x: number; y: number; z: number };

  /**
   * World point the eye looks at, in metres.
   */
  target: { x: number; y: number; z: number };

  /**
   * Lens this pose was resolved for.
   */
  lens: IAutoMovieViewerSubjectLens;

  /**
   * Near clip distance, in metres.
   */
  near: number;

  /**
   * Far clip distance, in metres.
   */
  far: number;
}
