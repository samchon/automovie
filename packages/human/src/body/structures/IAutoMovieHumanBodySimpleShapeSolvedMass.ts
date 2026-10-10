import type { IAutoMovieHumanBodySimpleShapeTerm } from "./IAutoMovieHumanBodySimpleShapeTerm";

/**
 * The mass direction: the channels a kilogram is spread over, as term rows
 * whose products are the direction's coefficients. The mass is solved as one
 * scalar along the direction, over the envelope of the channel named `range`.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeSolvedMass {
  /** The channel whose envelope bounds the mass scalar. */
  range: string;

  /** The direction's rows. */
  direction: IAutoMovieHumanBodySimpleShapeTerm[];
}
