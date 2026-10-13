/**
 * A look direction as **yaw** and **pitch** in degrees: the two angles a head,
 * eye, or camera turns through to face a target, relative to its own forward
 * (yaw = turn off straight-ahead, +90 = its left; pitch = tilt up (+) / down
 * (−)). A rig maps these onto its joints (a neck's twist + flexion, a camera's
 * pan + tilt).
 *
 * As `aimYawPitch` computes it, yaw lies in `(-180, 180]`, pitch in `[-90,
 * 90]`, and a zero-length aim yields `0` for both. There is no roll.
 *
 * @evidence contracts/common.md#principled-implementation `aimYawPitch` rotates the world aim into the actor frame and takes `atan2(localX, localZ)` for yaw and `atan2(dy, horizontal)` for pitch, the spherical decomposition of a direction with no roll.
 * @evidence contracts/common.md#clear-and-simple-design Two angles in degrees with no rig-specific fields, so the lookAt synthesis distributes one pair over neck and head joints and a camera could map the same pair onto pan and tilt.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No direction is special-cased except the degenerate zero-length aim, which returns zero for both angles by definition instead of `NaN`.
 * @evidence contracts/common.md#meaningful-documentation States the reference forward, the sign of each angle, the degree unit, both value ranges, the zero-aim result, and that roll is not represented.
 * @author Samchon
 */
export interface IAutoMovieYawPitch {
  /**
   * Turn off straight-ahead (degrees): 0 = dead ahead, +90 = the actor's left.
   */
  yawDeg: number;

  /** Tilt (degrees): positive looks up, negative looks down. */
  pitchDeg: number;
}
