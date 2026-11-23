import type { IAutoMovieHumanHandMeasures } from "./IAutoMovieHumanHandMeasures";

/**
 * A hand's measures with the scales its form takes, each solved at its
 * measure's site: the form is one shared hand in normalised coordinates,
 * and no fitted ratio stretches it.
 */
export interface IAutoMovieHumanHandScales extends IAutoMovieHumanHandMeasures {
  /** Millimetres per unit along the form, from the palm length at the middle finger's webs. */
  along: number;

  /** Millimetres per unit across the form, from the breadth over knuckles II to V. */
  across: number;

  /** Millimetres per unit through the form, from the hand tape over knuckles II to V. */
  through: number;

  /** Scale of the wrist's circle, from the wrist tape at stylion. */
  wrist: number;
}
