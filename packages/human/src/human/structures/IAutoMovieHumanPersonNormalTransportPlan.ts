import type { IAutoMovieHumanPersonNormalBinding } from "./IAutoMovieHumanPersonNormalBinding";
import type { IAutoMovieHumanPersonNormalCell } from "./IAutoMovieHumanPersonNormalCell";

/**
 * Admitted fixed source normal transport: every fixed normal cell in parent
 * order, and per skin half (face, then body) one binding per vertex, undefined
 * for an unused vertex. Returned arrays are owned.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportPlan {
  /** Every fixed normal cell, in parent order. */
  cells: IAutoMovieHumanPersonNormalCell[];

  /** Per half, face then body, each vertex's binding or undefined when unused. */
  bindings: (undefined | IAutoMovieHumanPersonNormalBinding)[][];
}
