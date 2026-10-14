import type { IAutoMovieViewerSubjectLens } from "./IAutoMovieViewerSubjectLens.js";

/**
 * Inspection eye and target in world metres, with perspective lens and positive ordered clip distances. Pose application currently requires an unparented camera or an identity parent transform.
 *
 * @evidence contracts/common.md#principled-implementation A look-at target plus explicit lens/clips defines a perspective camera without film time; finite admitted coordinates and a noncoincident eye/target remain caller premises.
 * @evidence contracts/common.md#clear-and-simple-design Separates pose construction from mutable camera application and encoded image capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not validate ranges or distinguish local from transformed-parent camera coordinates at runtime.
 * @evidence contracts/common.md#meaningful-documentation States frame, units, clip ordering and the camera parent limitation.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar pose data chooses no geometry traversal; numerical construction and camera updates retain their own costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Equivalent poses can describe repeated observations only with equivalent scene/population/source and renderer state, not from coordinates alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Pose and nested lens references remain caller owned; the type acquires no render target, native handle or task.
 *
 * @author Samchon
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
