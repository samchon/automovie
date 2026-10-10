import type { IAutoMovieHumanBodySimpleShapeSolvedMass } from "./IAutoMovieHumanBodySimpleShapeSolvedMass";

/**
 * The parameters the simple tier solves by measurement: the stature channel
 * and the mass direction.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeSolved {
  /** The body channel stature is solved along. */
  stature: string;

  /** The mass direction. */
  mass: IAutoMovieHumanBodySimpleShapeSolvedMass;
}
