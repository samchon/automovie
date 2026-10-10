import type { IAutoMovieHumanSkinLandmark } from "../basis/IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinRegion } from "../basis/IAutoMovieHumanSkinRegion";

/**
 * The head view of a person's skin at rest, as the head measurement rules
 * read it: the face producer skin's Float32 positions in the person frame,
 * its triangles, the surface index they belong to, and the head view basis's
 * named skin points and areas that address them.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadSkin {
  /** The head view basis identity, named in refusals. */
  id: string;

  /** The head view's surface index these positions belong to. */
  surface: number;

  /** Flat XYZ per head view vertex, Float32-quantized, in the person frame at rest. */
  positions: number[];

  /** Triangle vertex indices of the head view skin. */
  indices: number[];

  /** The head view basis's named skin points. */
  skinLandmarks?: Record<string, IAutoMovieHumanSkinLandmark>;

  /** The head view basis's named skin areas. */
  skinRegions?: Record<string, IAutoMovieHumanSkinRegion>;
}
