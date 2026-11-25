import type { IAutoMovieConstructionPointSeed } from "./IAutoMovieConstructionPointSeed";
import type { IAutoMovieConstructionSearchSeed } from "./IAutoMovieConstructionSearchSeed";

/**
 * Where a join's trace starts, discriminated on `type`: chart points near the
 * curve on both faces (`point`), or a search along one of the part's station
 * lines for its crossing with the host (`search`).
 */
export type IAutoMovieConstructionSeed =
  | IAutoMovieConstructionPointSeed
  | IAutoMovieConstructionSearchSeed;
