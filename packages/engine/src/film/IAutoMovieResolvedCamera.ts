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
 * @evidence contracts/common.md#principled-implementation A rigid placement is a translation plus a unit quaternion, and the readers invert the rotation to bring a world point into the camera frame; the camera clip's quaternion keys are taken as sampled, so the record carries the clip's own interpolation result.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, the extrinsics only, because field of view, aspect and clip planes belong to the staged camera and the readers take them as separate arguments; `IAutoMovieGrammarCameraObservation` extends it with the intrinsics a cut needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A clip missing a track falls back to that component of the staged base rather than to an identity or the previous frame, and no reader special-cases a camera id.
 * @evidence contracts/common.md#meaningful-documentation States the producer and its per-track fallback, the consumers, the viewing axis and up convention, and for each field its space and units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape with no runtime body; sampling it is one clip evaluation answered on `resolveCameraAt`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resolved per queried instant by the caller; nothing caches a camera placement across instants or shots.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds two small records; for a static camera or a missing track they are the staged base's own objects by reference, so a caller must copy before mutating.
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
