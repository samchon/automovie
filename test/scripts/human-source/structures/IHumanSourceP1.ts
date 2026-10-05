import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

/**
 * The P1 representation: the current two-basis structure with both skins
 * bound to the generation's one frozen cut through `sourcePartition`, so the
 * runtime seam joins identical source samples. Basis ids are new.
 *
 * @author Samchon
 */
export interface IHumanSourceP1 {
  face: IAutoMovieHumanFaceBasis;
  body: IAutoMovieHumanBodyBasis;
  checks: Record<string, number | boolean | string>;

  /** How the face contact lip margin chains were joined (`buildHumanSourceLipMarginChain`), for the generation manifest. */
  marginChain: Record<string, unknown>;
}
