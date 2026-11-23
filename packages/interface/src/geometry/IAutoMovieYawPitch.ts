/**
 * A look direction as yaw and pitch in degrees relative to an actor's forward.
 *
 * AimYawPitch rotates the world aim vector by the negated +Y facing, then uses
 * atan2(localX, localZ) for yaw and atan2(dy, horizontal) for elevation. Yaw
 * lies in [-180, 180], including either signed branch endpoint for a backward
 * target, with +90 toward the actor's left; pitch lies in [-90, 90], positive
 * up. A zero-length aim returns zero for both. There is no roll; lookAt
 * synthesis maps yaw to neck/head twist and negated pitch to flexion.
 */
export interface IAutoMovieYawPitch {
  /** Turn off straight-ahead in degrees: 0 ahead, +90 the actor's left. */
  yawDeg: number;

  /** Tilt in degrees: positive looks up, negative looks down. */
  pitchDeg: number;
}
