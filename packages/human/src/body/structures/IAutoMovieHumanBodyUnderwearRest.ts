import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The document's body at rest (its shape without its pose) that the
 * underwear's regions are read on.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearRest {
  /** Rest positions per basis surface, flat XYZ metres. */
  surfaces: number[][];

  /** Shaped joint landmarks by id. */
  landmarks: Record<string, IAutoMovieVector3>;
}
