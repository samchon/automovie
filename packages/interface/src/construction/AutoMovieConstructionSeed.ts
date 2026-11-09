import type { IAutoMovieConstructionPointSeed } from "./IAutoMovieConstructionPointSeed";
import type { IAutoMovieConstructionSearchSeed } from "./IAutoMovieConstructionSearchSeed";

/**
 * Where a join's trace starts, discriminated on `type`: chart points near the curve on both faces (`point`), or a search along one of the part's station lines for its crossing with the host (`search`).
 *
 * @evidence contracts/development/design.md#principled-representation The trace starts from one meeting point; an author who knows the contact's landmarks states it, and one who only knows where the part runs into its host lets the engine find it on the built surfaces.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two closed kinds, each with only the data its start needs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Either kind that finds no meeting is reported; neither falls back to the other.
 * @evidence contracts/development/common.md#meaningful-documentation States the two kinds and what each start needs.
 */
export type AutoMovieConstructionSeed =
  | IAutoMovieConstructionPointSeed
  | IAutoMovieConstructionSearchSeed;
