import type { IAutoMovieHumanBodyBasisCorrective } from "@automovie/human/body/structures/shape/IAutoMovieHumanBodyBasisCorrective";

/**
 * The correctives a solve run published, as the solver shard holds them.
 *
 * @author Samchon
 */
export interface IBodyCorrectiveShard {
  /** Correctives removed from the working basis before the solve. */
  dropped: string[];

  /** The correctives solved, in acceptance order. */
  correctives: IAutoMovieHumanBodyBasisCorrective[];

  /** Their rest rows by id, `[vertex, x, y, z]` repeated. */
  rows: Record<string, number[]>;
}
