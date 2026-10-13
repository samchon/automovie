import { IAutoMovieQuaternion } from "@automovie/interface";

/** One scored candidate articulation. */
export interface IAutoMovieHingedArticulation {
  /** Bone-local articulation delta for the chain-root joint (the shoulder). */
  upper: IAutoMovieQuaternion;

  /**
   * Bone-local articulation delta for the mid joint (the elbow): a pure
   * rotation about that joint's own flexion axis, so its abduction and twist
   * decompose to exactly zero.
   */
  lower: IAutoMovieQuaternion;

  /**
   * Total ROM overshoot of the chosen candidate in degrees, `0` when the pose
   * satisfies both joints. Reported rather than hidden: a rig whose declared
   * ranges genuinely cannot hold any pose that reaches the target must still
   * say so, instead of the solver quietly returning its least-bad attempt as if
   * it were clean.
   *
   * `Infinity` when the scorer found a violation with no measurable overshoot,
   * which {@link jointRomOvershoot} reserves for a non-finite angle: unusable
   * rather than free, so a malformed candidate can never win the selection.
   */
  overshoot: number;
}
