import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Authored humanoid bone assignments aligned with sweep spine points and
 * stations.
 */
export interface IAutoMovieSweepBinding {
  /** One humanoid bone identity per spine control, in spine order. */
  points: AutoMovieHumanoidBone[];

  /**
   * One tuple per station in station order. A single bone follows one link, and
   * two bones blend their turns at a spherical midpoint.
   */
  stations: Array<
    [AutoMovieHumanoidBone] | [AutoMovieHumanoidBone, AutoMovieHumanoidBone]
  >;
}
