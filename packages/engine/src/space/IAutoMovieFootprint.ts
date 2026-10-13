import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";

/**
 * A surface's plan region: the outer ring, and the holes cut out of it.
 *
 * @author Samchon
 */
export interface IAutoMovieFootprint {
  /** The ring that bounds the region. */
  readonly outer: IAutoMovieFootprintRing;

  /** Voids cut in {@link outer}; empty for a solid patch. */
  readonly holes: readonly IAutoMovieFootprintRing[];
}
