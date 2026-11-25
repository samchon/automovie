import type { IAutoMovieHumanParameters } from "@automovie/interface";

/**
 * One person of the motion tests' ANSUR 1988 boundary population: the minimal
 * source a body is prepared from, the Human parameters and the surveyed mass.
 */
export interface IMotionHumanPerson {
  /** The surveyed body mass, kilograms. */
  mass: number;

  /** The Human's parameters, millimetres where a length. */
  params: IAutoMovieHumanParameters;
}
