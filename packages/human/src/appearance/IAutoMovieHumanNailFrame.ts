import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/** Frame of one digit. */
export interface IAutoMovieHumanNailFrame {
  /** A point on the digit axis. */
  origin: AutoMovieHumanSkinVector.Vec3;

  /** Unit axis toward the tip. */
  axis: AutoMovieHumanSkinVector.Vec3;

  /** Unit dorsal direction perpendicular to the axis. */
  dorsal: AutoMovieHumanSkinVector.Vec3;

  /** Station of the tip along the axis from the origin, in mm. */
  tip: number;

  /** Mean radius of the distal digit in mm. */
  radius: number;
}
