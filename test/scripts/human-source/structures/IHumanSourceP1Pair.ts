import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

/**
 * The P1 face and body bases: the published bases re-bound to the
 * generation's one cut, each with its source partition.
 *
 * @author Samchon
 */
export interface IHumanSourceP1Pair {
  /** P1 face basis over the head cells. */
  face: IAutoMovieHumanFaceBasis;

  /** P1 body basis over the remaining cells. */
  body: IAutoMovieHumanBodyBasis;
}
