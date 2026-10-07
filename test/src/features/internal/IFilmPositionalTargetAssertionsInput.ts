import type { IAutoMoviePerformedShot } from "@automovie/engine";
import type { IAutoMovieActionCall } from "@automovie/interface";

/** Original positional-target performance and diagnostic readers. */
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
