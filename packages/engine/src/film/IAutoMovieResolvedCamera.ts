import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A camera's world placement at one instant: where the lens is and which way
 * it is turned.
 *
 * `resolveCameraAt` produces it from the staged base transform, or from the
 * shot's camera clip sampled at that time, taking each missing track from the
 * base. `projectToNdc`, the perspective frustum tests and the visual-read and
 * film-grammar observations consume it; the camera looks down its local `-Z`
 * with `+Y` up, as glTF and `three.js` cameras do.
 *
 * @evidence contracts/development/design.md#principled-representation A rigid placement is a translation plus a unit quaternion, and the readers invert the rotation to bring a world point into the camera frame; the camera clip's quaternion keys are taken as sampled, so the record carries the clip's own interpolation result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields, the extrinsics only, because field of view, aspect and clip planes belong to the staged camera and the readers take them as separate arguments; `IAutoMovieGrammarCameraObservation` extends it with the intrinsics a cut needs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A clip missing a track falls back to that component of the staged base rather than to an identity or the previous frame, and no reader special-cases a camera id.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer and its per-track fallback, the consumers, the viewing axis and up convention, and for each field its space and units.
 */
export interface IAutoMovieResolvedCamera {
  /** Lens position in world space, metres. */
  position: IAutoMovieVector3;

  /**
   * World orientation as a unit quaternion taking the camera's local frame
   * (looking down `-Z`, `+Y` up) to world space.
   */
  rotation: IAutoMovieQuaternion;
}
