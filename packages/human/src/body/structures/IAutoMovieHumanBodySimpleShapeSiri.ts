/**
 * Siri's two-compartment density model as the table stores it: body fat
 * fraction = numerator / density − offset.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeSiri {
  /** The numerator of Siri's equation. */
  numerator: number;

  /** The offset of Siri's equation. */
  offset: number;
}
