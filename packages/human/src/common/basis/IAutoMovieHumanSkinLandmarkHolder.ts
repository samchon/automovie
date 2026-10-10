import type { IAutoMovieHumanSkinLandmark } from "./IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinLandmarkSurface } from "./IAutoMovieHumanSkinLandmarkSurface";

/**
 * A basis that may name points of its skin: its identity, its surfaces'
 * positions and its named skin points. Face and body bases both satisfy it.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinLandmarkHolder {
  /** The basis identity, named in refusals. */
  id: string;

  /** The basis surfaces, by index. */
  surfaces: readonly IAutoMovieHumanSkinLandmarkSurface[];

  /** The basis's named skin points. */
  skinLandmarks?: Record<string, IAutoMovieHumanSkinLandmark>;
}
