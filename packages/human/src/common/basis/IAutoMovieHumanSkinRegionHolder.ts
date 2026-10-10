import type { IAutoMovieHumanSkinLandmarkSurface } from "./IAutoMovieHumanSkinLandmarkSurface";
import type { IAutoMovieHumanSkinRegion } from "./IAutoMovieHumanSkinRegion";

/**
 * A basis that may name areas of its skin: its identity, its surfaces'
 * positions and its named skin areas. Face and body bases both satisfy it.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinRegionHolder {
  /** The basis identity, named in refusals. */
  id: string;

  /** The basis surfaces, by index. */
  surfaces: readonly IAutoMovieHumanSkinLandmarkSurface[];

  /** The basis's named skin areas. */
  skinRegions?: Record<string, IAutoMovieHumanSkinRegion>;
}
