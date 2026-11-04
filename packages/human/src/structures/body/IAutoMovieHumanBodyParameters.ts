import { IAutoMovieHumanBodyAnatomy } from "./IAutoMovieHumanBodyAnatomy";

/**
 * Primary body parameter record. Lengths use mm; each field keeps the unit and
 * the published definition its own documentation states.
 */
export interface IAutoMovieHumanBodyParameters {
  /** Stature, tapes, segment lengths, skeletal breadths, landmark heights and fat percentage; each omitted measure takes its survey default. */
  anatomy: IAutoMovieHumanBodyAnatomy;
}
