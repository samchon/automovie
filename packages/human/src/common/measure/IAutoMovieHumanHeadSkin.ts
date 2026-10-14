import type { IAutoMovieHumanSkinLandmark } from "../basis/IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinRegion } from "../basis/IAutoMovieHumanSkinRegion";

/**
 * The head view of a person's skin at rest, as the head measurement rules
 * read it: the face producer skin's Float32 positions in the person frame,
 * its triangles, the surface index they belong to, and the head view basis's
 * named skin points and areas that address them.
 *
 *
 * @evidence contracts/common.md#principled-implementation Float32-quantized rest face positions, triangle indices and named basis landmarks/regions share one person frame and surface identity; producing readers establish that alignment.
 * @evidence contracts/common.md#clear-and-simple-design The view exposes only the resident skin inputs required by head instruments, while rest evaluation and registration validation retain their own owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It carries no bone proxy, expected head measurements or consumer exceptions; optional registration absence remains observable to named lookup refusals.
 * @evidence contracts/common.md#meaningful-documentation The prose gives rest state, Float32 precision, person frame and surface/name meaning; optional points/areas are explicitly represented.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This skin-view interface chooses no quantization or triangle-processing strategy; producing/evaluating operations own those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The view declares no snapshot cache or cross-person equivalence for its mutable arrays and dictionaries.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Concrete positions/indices and optional registration records are held by their caller; the erased declaration owns no live resource or release action.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadSkin {
  /** The head view basis identity, named in refusals. */
  id: string;

  /** The head view's surface index these positions belong to. */
  surface: number;

  /** Flat XYZ per head view vertex, metres, Float32-quantized in the person frame at rest. */
  positions: number[];

  /** Triangle vertex indices of the head view skin. */
  indices: number[];

  /** The head view basis's named skin points. */
  skinLandmarks?: Record<string, IAutoMovieHumanSkinLandmark>;

  /** The head view basis's named skin areas. */
  skinRegions?: Record<string, IAutoMovieHumanSkinRegion>;
}
