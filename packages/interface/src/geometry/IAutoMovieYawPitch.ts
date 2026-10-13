/**
 * A look direction as yaw and pitch in degrees: the two angles a head or eye
 * turns through to face a target, relative to its own forward.
 *
 * The engine's `aimYawPitch` produces it by rotating the world aim vector by
 * the negated facing about +Y, then taking `atan2(localX, localZ)` for yaw and
 * the elevation `atan2(dy, horizontal)` for pitch. Yaw therefore lies in
 * `(-180, 180]` with `+90` toward the actor's left, pitch in `[-90, 90]`, and a
 * zero-length aim answers `0` for both. There is no roll. Its one consumer is
 * the `lookAt` synthesis, which turns yaw into neck and head twist and the
 * negated pitch into their flexion.
 *
 * @evidence contracts/common.md#principled-implementation Spherical angles of the aim vector in the actor's own frame: `atan2` gives a quadrant-correct heading and a pitch measured against the horizontal length, so a target straight above or below reads ±90 without dividing by zero.
 * @evidence contracts/common.md#clear-and-simple-design Two angles are the whole look state of a roll-free gaze, so the record carries no vector or quaternion and the rig mapping stays in the synthesizer that owns the neck and head.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The degenerate zero-length aim answers a stated `0, 0` rather than `NaN`, and non-finite inputs are refused by `aimYawPitch` before any angle is computed.
 * @evidence contracts/common.md#meaningful-documentation States the frame, the formulas, both ranges and the sign of each angle, the degenerate case, the absent roll, and the one consumer with the joints it drives.
 * @author Samchon
 */
export interface IAutoMovieYawPitch {
  /** Turn off straight-ahead in degrees: 0 ahead, +90 the actor's left. */
  yawDeg: number;

  /** Tilt in degrees: positive looks up, negative looks down. */
  pitchDeg: number;
}
