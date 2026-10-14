import type { IAutoMovieActionCall } from "@automovie/interface";

import type { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";

/**
 * Original positional-target performance and diagnostic readers.
 *
 * @author Samchon
 */
export interface IFilmPositionalTargetAssertionsInput {
  /** Execute the original staged draft. */
  perform(draft: IAutoMovieActionCall[]): IAutoMoviePerformedShot;

  /** Read every required diagnostic fragment from the same result. */
  says(
    result: IAutoMoviePerformedShot,
    path: string,
    ...fragments: string[]
  ): boolean;

  /** Read absence of a refusal at the original diagnostic path. */
  silentAt(result: IAutoMoviePerformedShot, path: string): boolean;
}
