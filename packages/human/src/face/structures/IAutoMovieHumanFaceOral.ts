import type { IAutoMovieHumanFaceOralArch } from "./IAutoMovieHumanFaceOralArch";
import type { IAutoMovieHumanFaceOralPerformance } from "./IAutoMovieHumanFaceOralPerformance";
import type { IAutoMovieHumanFaceOralSpace } from "./IAutoMovieHumanFaceOralSpace";
import type { IAutoMovieHumanFaceOralTongue } from "./IAutoMovieHumanFaceOralTongue";
import type { IAutoMovieHumanFaceOralTooth } from "./IAutoMovieHumanFaceOralTooth";

/**
 * Numerical coarse oral assembly on the connected source: independently sized
 * permanent source crowns, upper/lower arches, their common cervical gingiva,
 * palate/floor/walls, and source tongue identity and performance. Existing lip,
 * commissure and jaw channels remain their source owners. Clinical observations
 * remain separate, with unknown acquisition and tissue properties preserved.
 * Omission retains the historical source replay without generating a new layer.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOral {
  /** Independent ISO3950 permanent source crowns; unlisted entries retain source geometry, not inferred clinical eruption. */
  teeth?: Partial<Record<`${1 | 2 | 3 | 4}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`, IAutoMovieHumanFaceOralTooth>>;

  /** Maxillary arch and gingiva, independent of mandibular identity. */
  maxillary?: IAutoMovieHumanFaceOralArch;

  /** Mandibular arch and gingiva, carried by the source jaw owner. */
  mandibular?: IAutoMovieHumanFaceOralArch;

  /** Palate, floor and wall clearances, independently of crowns and tongue. */
  space?: IAutoMovieHumanFaceOralSpace;

  /** Persistent source-tongue dimensions, independently of current performance. */
  tongue?: IAutoMovieHumanFaceOralTongue;

  /** Current independent source-tongue performance; omission is neutral. */
  performance?: IAutoMovieHumanFaceOralPerformance;
}
