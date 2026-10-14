/**
 * A look direction as yaw and pitch in degrees relative to an actor's forward.
 *
 * aimYawPitch rotates the world aim vector by the negated +Y facing, then uses atan2(localX, localZ) for yaw and atan2(dy, horizontal) for elevation. Yaw lies in [-180, 180], including either signed branch endpoint for a backward target, with +90 toward the actor's left; pitch lies in [-90, 90], positive up. A zero-length aim returns zero for both. There is no roll; lookAt synthesis maps yaw to neck/head twist and negated pitch to flexion.
 *
 * @evidence contracts/common.md#principled-implementation Spherical angles of the aim vector in the actor's own frame: `atan2` gives a quadrant-correct heading and a pitch measured against the horizontal length, so a target straight above or below reads ±90 without dividing by zero.
 * @evidence contracts/common.md#clear-and-simple-design Two angles are the whole look state of a roll-free gaze, so the record carries no vector or quaternion and the rig mapping stays in the synthesizer that owns the neck and head.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The degenerate zero-length aim answers a stated `0, 0` rather than `NaN`, and non-finite inputs are refused by `aimYawPitch` before any angle is computed.
 * @evidence contracts/common.md#meaningful-documentation States frame, formulas, yaw's signed branch endpoints, pitch range, angle signs, zero-aim convention, absent roll and the synthesis consumer's joint mapping.
 * @author Samchon
 */
export interface IAutoMovieYawPitch {
  /** Turn off straight-ahead in degrees: 0 ahead, +90 the actor's left. */
  yawDeg: number;

  /** Tilt in degrees: positive looks up, negative looks down. */
  pitchDeg: number;
}
