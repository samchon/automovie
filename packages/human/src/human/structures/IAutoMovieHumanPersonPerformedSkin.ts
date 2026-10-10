/**
 * The two performed halves of a person's skin in the common body frame: the
 * face skin's flat positions, the body skin's flat positions after the cut,
 * and the body triangle indices retained by that cut. Positions are metres,
 * Y up, +Z forward.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonPerformedSkin {
  /** Face skin flat positions, metres. */
  face: readonly number[];

  /** Cut body skin flat positions, metres. */
  body: readonly number[];

  /** Body triangle vertex index triples retained by the cut. */
  bodyIndices: readonly number[];
}
