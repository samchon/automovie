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
